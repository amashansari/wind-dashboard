import math
from typing import Dict, List, Optional, Tuple, Any

def calculate_accuracy_metrics(
    pairs: List[Tuple[float, float]],
    expected_count: Optional[int] = None
) -> Dict[str, Any]:
    """
    Calculate headline forecast accuracy metrics for matched (forecast, actual) pairs.
    
    Convention:
        error = forecast - actual
        MAE = mean(|forecast - actual|)
        RMSE = sqrt(mean((forecast - actual)^2))
        Bias = mean(forecast - actual)
        
    Positive bias indicates overforecasting (forecast > actual).
    Negative bias indicates underforecasting (forecast < actual).
    """
    matched_count = len(pairs)
    if expected_count is None:
        expected_count = matched_count

    coverage = (
        round((matched_count / expected_count) * 100.0, 2)
        if expected_count > 0 else 0.0
    )

    if matched_count == 0:
        return {
            "matchedCount": 0,
            "expectedCount": expected_count,
            "coveragePercentage": 0.0,
            "mae": None,
            "rmse": None,
            "meanBias": None,
            "biasInterpretation": "No matched observations available for the selected period.",
        }

    errors = [forecast - actual for forecast, actual in pairs]
    abs_errors = [abs(e) for e in errors]
    squared_errors = [e ** 2 for e in errors]

    mae = round(sum(abs_errors) / matched_count, 2)
    rmse = round(math.sqrt(sum(squared_errors) / matched_count), 2)
    mean_bias = round(sum(errors) / matched_count, 2)

    if mean_bias > 0:
        interpretation = f"Overforecasting by {mean_bias} MW on average"
    elif mean_bias < 0:
        interpretation = f"Underforecasting by {abs(mean_bias)} MW on average"
    else:
        interpretation = "Unbiased (mean error is 0.0 MW)"

    return {
        "matchedCount": matched_count,
        "expectedCount": expected_count,
        "coveragePercentage": coverage,
        "mae": mae,
        "rmse": rmse,
        "meanBias": mean_bias,
        "biasInterpretation": interpretation,
    }
