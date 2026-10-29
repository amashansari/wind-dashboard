from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from dateutil import parser
from backend.app.schemas.forecast import ForecastsResponse, VintagesResponse
from backend.app.services.repository import repository

router = APIRouter(tags=["Forecasts"])

@router.get("/forecasts", response_model=ForecastsResponse)
def get_forecasts(
    startDate: str = Query(..., description="Start date in YYYY-MM-DD format (e.g. 2026-01-01)"),
    endDate: str = Query(..., description="End date in YYYY-MM-DD format (e.g. 2026-01-07)"),
    cutoffPreset: str = Query("day_ahead_12", description="Cutoff preset: day_ahead_12, day_ahead_17, same_day_06"),
    customCutoff: Optional[str] = Query(None, description="Optional custom cutoff ISO timestamp")
):
    try:
        custom_dt = parser.isoparse(customCutoff) if customCutoff else None
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid customCutoff timestamp: {e}")

    intervals, cutoff_applied = repository.get_forecasts_and_actuals(
        start_date_str=startDate,
        end_date_str=endDate,
        cutoff_preset=cutoffPreset,
        custom_cutoff=custom_dt
    )

    matched_count = sum(1 for item in intervals if item["isMatched"])

    return ForecastsResponse(
        startDate=startDate,
        endDate=endDate,
        cutoffPolicyApplied=cutoff_applied,
        totalIntervals=len(intervals),
        matchedIntervals=matched_count,
        intervals=intervals
    )

@router.get("/vintages", response_model=VintagesResponse)
def get_vintages(
    deliveryTime: str = Query(..., description="Target delivery interval in ISO 8601 UTC format"),
    cutoffPreset: str = Query("day_ahead_12", description="Cutoff preset: day_ahead_12, day_ahead_17, same_day_06"),
    customCutoff: Optional[str] = Query(None, description="Optional custom cutoff ISO timestamp")
):
    try:
        delivery_dt = parser.isoparse(deliveryTime)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid deliveryTime timestamp: {e}")

    try:
        custom_dt = parser.isoparse(customCutoff) if customCutoff else None
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid customCutoff timestamp: {e}")

    vintages_data = repository.get_vintages_for_interval(
        target_delivery_time=delivery_dt,
        cutoff_preset=cutoffPreset,
        custom_cutoff=custom_dt
    )

    return VintagesResponse(**vintages_data)
