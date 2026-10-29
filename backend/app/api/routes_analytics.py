from datetime import datetime
from typing import Optional, List, Dict
from fastapi import APIRouter, Query, HTTPException
from dateutil import parser
from backend.app.schemas.analytics import AccuracyResponse, DailyAccuracyItem, LeadTimesResponse
from backend.app.services.repository import repository
from backend.app.analytics.metrics import calculate_accuracy_metrics
from backend.app.analytics.lead_time import calculate_lead_time_analytics

router = APIRouter(tags=["Analytics"])

@router.get("/accuracy", response_model=AccuracyResponse)
def get_accuracy(
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

    # Filter matched pairs
    matched_pairs = [
        (item["forecastGenerationMW"], item["actualGenerationMW"])
        for item in intervals
        if item["isMatched"]
    ]

    # Calculate overall metrics
    # Expected count is based on number of hourly delivery intervals (24 per day)
    overall_metrics = calculate_accuracy_metrics(matched_pairs)

    # Compute daily breakdown
    daily_groups: Dict[str, List] = {}
    for item in intervals:
        date_str = item["deliveryStartTime"].strftime("%Y-%m-%d")
        if date_str not in daily_groups:
            daily_groups[date_str] = []
        if item["isMatched"]:
            daily_groups[date_str].append((item["forecastGenerationMW"], item["actualGenerationMW"]))

    daily_breakdown = []
    for d_str in sorted(daily_groups.keys()):
        d_pairs = daily_groups[d_str]
        # Expected count per day is 24 hourly intervals
        d_metrics = calculate_accuracy_metrics(d_pairs, expected_count=24)
        daily_breakdown.append(DailyAccuracyItem(
            date=d_str,
            mae=d_metrics["mae"],
            rmse=d_metrics["rmse"],
            meanBias=d_metrics["meanBias"],
            matchedCount=d_metrics["matchedCount"],
            expectedCount=d_metrics["expectedCount"],
            coveragePercentage=d_metrics["coveragePercentage"]
        ))

    return AccuracyResponse(
        startDate=startDate,
        endDate=endDate,
        cutoffPolicy=cutoff_applied,
        generationUnit="MW",
        matchedSampleCount=overall_metrics["matchedCount"],
        expectedIntervalCount=len(daily_breakdown) * 24 if daily_breakdown else overall_metrics["matchedCount"],
        coveragePercentage=overall_metrics["coveragePercentage"],
        mae=overall_metrics["mae"],
        rmse=overall_metrics["rmse"],
        meanBias=overall_metrics["meanBias"],
        biasInterpretation=overall_metrics["biasInterpretation"],
        dailyBreakdown=daily_breakdown
    )

@router.get("/lead-times", response_model=LeadTimesResponse)
def get_lead_times(
    startDate: str = Query(..., description="Start date in YYYY-MM-DD format (e.g. 2026-01-01)"),
    endDate: str = Query(..., description="End date in YYYY-MM-DD format (e.g. 2026-01-31)"),
    cutoffPreset: str = Query("day_ahead_12", description="Cutoff preset: day_ahead_12, day_ahead_17, same_day_06")
):
    intervals, _ = repository.get_forecasts_and_actuals(
        start_date_str=startDate,
        end_date_str=endDate,
        cutoff_preset=cutoffPreset
    )

    lead_time_buckets = calculate_lead_time_analytics(intervals)

    return LeadTimesResponse(
        startDate=startDate,
        endDate=endDate,
        buckets=lead_time_buckets
    )
