import json
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dateutil import parser
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.analytics.selector import (
    ForecastRecord,
    select_forecast_at_cutoff,
    calculate_lead_time_hours
)

class DataRepository:
    def __init__(self):
        self.actuals: Dict[datetime, Dict[str, Any]] = {}
        self.forecasts_by_start: Dict[datetime, List[ForecastRecord]] = {}
        self.all_forecasts: List[Dict[str, Any]] = []
        self.is_loaded: bool = False
        self.last_loaded_time: Optional[datetime] = None

    def load_data(self):
        actuals_path = os.path.join(settings.DATA_DIR, "january_2026_actuals.json")
        forecasts_path = os.path.join(settings.DATA_DIR, "january_2026_forecasts.json")

        logger.info(f"Loading data from {settings.DATA_DIR}...")
        
        # Load actuals
        if os.path.exists(actuals_path):
            with open(actuals_path, "r", encoding="utf-8") as f:
                raw_actuals = json.load(f)
            self.actuals.clear()
            for rec in raw_actuals:
                st = parser.isoparse(rec["startTime"])
                if st.tzinfo is None:
                    st = st.replace(tzinfo=timezone.utc)
                self.actuals[st] = {
                    "startTime": st,
                    "generation": float(rec.get("generation", 0.0)),
                    "settlementPeriod": rec.get("settlementPeriod"),
                    "settlementDate": rec.get("settlementDate")
                }
            logger.info(f"Loaded {len(self.actuals)} WIND actual records.")
        else:
            logger.warning(f"Actuals file not found at {actuals_path}")

        # Load forecasts
        if os.path.exists(forecasts_path):
            with open(forecasts_path, "r", encoding="utf-8") as f:
                raw_forecasts = json.load(f)
            self.forecasts_by_start.clear()
            self.all_forecasts = raw_forecasts
            for rec in raw_forecasts:
                st = parser.isoparse(rec["startTime"])
                pt = parser.isoparse(rec["publishTime"])
                if st.tzinfo is None:
                    st = st.replace(tzinfo=timezone.utc)
                if pt.tzinfo is None:
                    pt = pt.replace(tzinfo=timezone.utc)
                
                f_record = ForecastRecord(
                    start_time=st,
                    publish_time=pt,
                    generation=float(rec.get("generation", 0.0))
                )
                if st not in self.forecasts_by_start:
                    self.forecasts_by_start[st] = []
                self.forecasts_by_start[st].append(f_record)
            
            logger.info(f"Loaded {len(raw_forecasts)} WINDFOR forecast records spanning {len(self.forecasts_by_start)} distinct delivery intervals.")
        else:
            logger.warning(f"Forecasts file not found at {forecasts_path}")

        self.is_loaded = True
        self.last_loaded_time = datetime.now(timezone.utc)

    def get_effective_cutoff(
        self,
        delivery_dt: datetime,
        cutoff_preset: str = "day_ahead_12",
        custom_cutoff: Optional[datetime] = None
    ) -> datetime:
        """
        Derive the decision cutoff timestamp.
        Default: Day-Ahead 12:00 UTC (D-1 at 12:00 UTC).
        """
        if custom_cutoff is not None:
            if custom_cutoff.tzinfo is None:
                return custom_cutoff.replace(tzinfo=timezone.utc)
            return custom_cutoff

        # Extract delivery date in UTC
        delivery_date = delivery_dt.date()
        day_before = delivery_date - timedelta(days=1)

        if cutoff_preset == "day_ahead_17":
            return datetime(day_before.year, day_before.month, day_before.day, 17, 0, 0, tzinfo=timezone.utc)
        elif cutoff_preset == "same_day_06":
            return datetime(delivery_date.year, delivery_date.month, delivery_date.day, 6, 0, 0, tzinfo=timezone.utc)
        else:
            # Default: Day-Ahead 12:00 UTC
            return datetime(day_before.year, day_before.month, day_before.day, 12, 0, 0, tzinfo=timezone.utc)

    def get_forecasts_and_actuals(
        self,
        start_date_str: str,
        end_date_str: str,
        cutoff_preset: str = "day_ahead_12",
        custom_cutoff: Optional[datetime] = None
    ) -> Tuple[List[Dict[str, Any]], str]:
        """
        Query delivery intervals for the given date range and select the forecast vintage
        at the specified cutoff.
        Returns (intervals_list, applied_cutoff_description).
        """
        if not self.is_loaded:
            self.load_data()

        start_dt = parser.isoparse(start_date_str)
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        start_dt = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)

        end_dt = parser.isoparse(end_date_str)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)
        end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Collect all intervals in scope (both :00 and :30)
        # Find delivery timestamps from either actuals or forecasts
        all_timestamps = set()
        for dt in self.actuals.keys():
            if start_dt <= dt <= end_dt:
                all_timestamps.add(dt)
        for dt in self.forecasts_by_start.keys():
            if start_dt <= dt <= end_dt:
                all_timestamps.add(dt)

        sorted_timestamps = sorted(all_timestamps)
        intervals = []

        sample_cutoff_desc = (
            custom_cutoff.isoformat() if custom_cutoff
            else f"{cutoff_preset} (e.g. D-1 at 12:00 UTC)"
        )

        for dt in sorted_timestamps:
            # Determine cutoff for this specific delivery timestamp
            cutoff = self.get_effective_cutoff(dt, cutoff_preset, custom_cutoff)
            
            # Lookup actual
            act = self.actuals.get(dt)
            actual_mw = act["generation"] if act else None
            settlement_period = act["settlementPeriod"] if act else None

            # Lookup forecast at cutoff
            candidate_forecasts = self.forecasts_by_start.get(dt, [])
            selected_f = select_forecast_at_cutoff(dt, cutoff, candidate_forecasts)

            if selected_f is not None:
                forecast_mw = selected_f.generation
                publish_time = selected_f.publish_time
                lead_time = calculate_lead_time_hours(dt, publish_time)
            else:
                forecast_mw = None
                publish_time = None
                lead_time = None

            is_matched = (actual_mw is not None and forecast_mw is not None)
            error_mw = round(forecast_mw - actual_mw, 2) if is_matched else None
            abs_error_mw = round(abs(error_mw), 2) if is_matched else None

            intervals.append({
                "deliveryStartTime": dt,
                "settlementPeriod": settlement_period,
                "actualGenerationMW": actual_mw,
                "forecastGenerationMW": forecast_mw,
                "forecastPublishTime": publish_time,
                "leadTimeHours": lead_time,
                "errorMW": error_mw,
                "absoluteErrorMW": abs_error_mw,
                "isMatched": is_matched,
            })

        return intervals, sample_cutoff_desc

    def get_vintages_for_interval(
        self,
        target_delivery_time: datetime,
        cutoff_preset: str = "day_ahead_12",
        custom_cutoff: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get all publication vintages for a specific delivery interval,
        tagging which ones were available at the decision cutoff.
        """
        if not self.is_loaded:
            self.load_data()

        if target_delivery_time.tzinfo is None:
            target_delivery_time = target_delivery_time.replace(tzinfo=timezone.utc)

        cutoff = self.get_effective_cutoff(target_delivery_time, cutoff_preset, custom_cutoff)
        candidates = self.forecasts_by_start.get(target_delivery_time, [])

        selected_f = select_forecast_at_cutoff(target_delivery_time, cutoff, candidates)
        selected_pt = selected_f.publish_time if selected_f else None

        vintages = []
        for f in sorted(candidates, key=lambda x: x.publish_time):
            lead_time = calculate_lead_time_hours(target_delivery_time, f.publish_time)
            vintages.append({
                "publishTime": f.publish_time,
                "leadTimeHours": lead_time,
                "forecastGenerationMW": f.generation,
                "isEligibleAtCutoff": f.publish_time <= cutoff,
            })

        return {
            "deliveryStartTime": target_delivery_time,
            "cutoffApplied": cutoff,
            "selectedPublishTime": selected_pt,
            "vintages": vintages,
        }

repository = DataRepository()
