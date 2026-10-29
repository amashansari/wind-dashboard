import math
from typing import Dict, List, Optional, Any
from backend.app.analytics.metrics import calculate_accuracy_metrics

LEAD_TIME_BUCKETS = [
    {"bucketName": "Intraday (1-4h)", "minLeadHours": 1.0, "maxLeadHours": 4.0},
    {"bucketName": "Near Day-Ahead (4-12h)", "minLeadHours": 4.0, "maxLeadHours": 12.0},
    {"bucketName": "Day-Ahead Auction (12-24h)", "minLeadHours": 12.0, "maxLeadHours": 24.0},
    {"bucketName": "Multi-Day Ahead (24-48h)", "minLeadHours": 24.0, "maxLeadHours": 48.0},
]

def calculate_lead_time_analytics(
    observations: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Compute accuracy metrics grouped by forecast lead time horizon buckets.
    observations is a list of dicts with:
        {'leadTimeHours': float, 'forecastGenerationMW': float, 'actualGenerationMW': float}
    """
    results = []

    for bucket in LEAD_TIME_BUCKETS:
        min_lead = bucket["minLeadHours"]
        max_lead = bucket["maxLeadHours"]
        
        # Select observations that fall within (min_lead, max_lead]
        bucket_obs = [
            (obs["forecastGenerationMW"], obs["actualGenerationMW"])
            for obs in observations
            if obs.get("leadTimeHours") is not None
            and obs.get("forecastGenerationMW") is not None
            and obs.get("actualGenerationMW") is not None
            and min_lead <= obs["leadTimeHours"] <= max_lead
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
