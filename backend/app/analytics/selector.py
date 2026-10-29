from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

class ForecastRecord:
    def __init__(self, start_time: datetime, publish_time: datetime, generation: float):
        self.start_time = start_time
        self.publish_time = publish_time
        self.generation = generation

def select_forecast_at_cutoff(
    target_delivery_time: datetime,
    cutoff_time: datetime,
    candidate_forecasts: List[ForecastRecord]
) -> Optional[ForecastRecord]:
    """
    Select the latest eligible forecast vintage for a target delivery interval
    without look-ahead bias.
    
    Constraint: publishTime <= cutoff_time.
    If multiple eligible vintages exist, select the one with the maximum publishTime.
    If no vintage was published prior to cutoff_time, return None.
    """
    # Ensure timezone awareness in UTC
    if target_delivery_time.tzinfo is None:
        target_delivery_time = target_delivery_time.replace(tzinfo=timezone.utc)
    if cutoff_time.tzinfo is None:
        cutoff_time = cutoff_time.replace(tzinfo=timezone.utc)

    eligible = [
        f for f in candidate_forecasts
        if f.start_time == target_delivery_time and f.publish_time <= cutoff_time
    ]

    if not eligible:
        return None

    # Pick latest publishTime
    return max(eligible, key=lambda f: f.publish_time)

def calculate_lead_time_hours(delivery_time: datetime, publish_time: datetime) -> float:
    """Calculate forecast lead time in hours (delivery_time - publish_time)."""
    if delivery_time.tzinfo is None:
        delivery_time = delivery_time.replace(tzinfo=timezone.utc)
    if publish_time.tzinfo is None:
        publish_time = publish_time.replace(tzinfo=timezone.utc)
    delta = delivery_time - publish_time
    return round(delta.total_seconds() / 3600.0, 2)
