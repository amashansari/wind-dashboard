from datetime import datetime
from typing import Optional, List, Dict
from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas.analytics import AccuracyResponse, DailyAccuracyItem, LeadTimesResponse
from backend.app.services.repository import repository
from backend.app.analytics.metrics import calculate_accuracy_metrics
from backend.app.analytics.lead_time import calculate_lead_time_analytics
from backend.app.api.validation import validate_date_range_and_cutoff

router = APIRouter(tags=["Analytics"])

@router.get("/accuracy", response_model=AccuracyResponse)
def get_accuracy(
    startDate: str = Query(..., description="Start date in YYYY-MM-DD format (e.g. 2026-01-01)"),
    endDate: str = Query(..., description="End date in YYYY-MM-DD format (e.g. 2026-01-07)"),
    cutoffPreset: str = Query("day_ahead_12", description="Cutoff preset: day_ahead_12, day_ahead_17, same_day_06"),
    customCutoff: Optional[str] = Query(None, description="Optional custom cutoff ISO timestamp")
):
    start_dt, end_dt, custom_dt = validate_date_range_and_cutoff(
        start_date_str=startDate,
        end_date_str=endDate,
        cutoff_preset=cutoffPreset,
        custom_cutoff_str=customCutoff
    )

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

    # Calculate daily breakdown
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

    # Calculate overall metrics with rigorous expected interval count
    # 24 hourly intervals per calendar day in range
    days_in_scope = (end_dt.date() - start_dt.date()).days + 1
    total_expected_count = max(days_in_scope * 24, len(daily_breakdown) * 24)
    overall_metrics = calculate_accuracy_metrics(matched_pairs, expected_count=total_expected_count)

    return AccuracyResponse(
        startDate=startDate,
        endDate=endDate,
        cutoffPolicy=cutoff_applied,
        generationUnit="MW",
        matchedSampleCount=overall_metrics["matchedCount"],
        expectedIntervalCount=total_expected_count,
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
    validate_date_range_and_cutoff(
        start_date_str=startDate,
        end_date_str=endDate,
        cutoff_preset=cutoffPreset
    )

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
