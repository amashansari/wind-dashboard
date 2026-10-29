import math
from typing import Dict, List, Optional, Any
from backend.app.analytics.metrics import calculate_accuracy_metrics

LEAD_TIME_BUCKETS = [
    {"bucketName": "Intraday (1-4h)", "minLeadHours": 0.0, "maxLeadHours": 4.0},
    {"bucketName": "Near Day-Ahead (4-12h)", "minLeadHours": 4.0, "maxLeadHours": 12.0},
    {"bucketName": "Day-Ahead Auction (12-24h)", "minLeadHours": 12.0, "maxLeadHours": 24.0},
    {"bucketName": "Multi-Day Ahead (>24h)", "minLeadHours": 24.0, "maxLeadHours": 999.0},
]

def calculate_lead_time_analytics(
    observations: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Compute accuracy metrics grouped by forecast lead time horizon buckets.
    Buckets are half-open disjoint intervals [min, max) to strictly prevent double-counting,
    with the final bucket spanning all multi-day horizons [24, inf).
    
    observations is a list of dicts with:
        {'leadTimeHours': float, 'forecastGenerationMW': float, 'actualGenerationMW': float}
    """
    results = []
    total_buckets = len(LEAD_TIME_BUCKETS)

    for i, bucket in enumerate(LEAD_TIME_BUCKETS):
        min_lead = bucket["minLeadHours"]
        max_lead = bucket["maxLeadHours"]
        is_last = (i == total_buckets - 1)
        
        # Partition half-open: [min_lead, max_lead) except for the last bucket [min_lead, max_lead]
        bucket_obs = [
            (obs["forecastGenerationMW"], obs["actualGenerationMW"])
            for obs in observations
            if obs.get("leadTimeHours") is not None
            and obs.get("forecastGenerationMW") is not None
            and obs.get("actualGenerationMW") is not None
            and (
                (min_lead <= obs["leadTimeHours"] <= max_lead) if is_last
                else (min_lead <= obs["leadTimeHours"] < max_lead)
            )
        ]

        metrics = calculate_accuracy_metrics(bucket_obs)
        results.append({
            "bucketName": bucket["bucketName"],
            "minLeadHours": min_lead,
            "maxLeadHours": max_lead,
            "mae": metrics["mae"],
            "rmse": metrics["rmse"],
            "meanBias": metrics["meanBias"],
            "sampleCount": metrics["matchedCount"],
        })

    return results
