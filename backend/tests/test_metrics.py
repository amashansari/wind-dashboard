import math
import pytest
from backend.app.analytics.metrics import calculate_accuracy_metrics
from backend.app.analytics.lead_time import calculate_lead_time_analytics

def test_hand_calculated_metrics():
    """
    Test with hand-calculated synthetic fixtures:
    Pairs (forecast, actual):
      1) (100, 90)   -> error = +10, abs = 10, sq = 100
      2) (200, 220)  -> error = -20, abs = 20, sq = 400
      3) (150, 150)  -> error = 0,   abs = 0,  sq = 0
    Sum abs = 30 -> MAE = 10.0
    Sum sq = 500 -> MSE = 166.6667 -> RMSE = 12.91
    Sum errors = -10 -> Mean Bias = -3.33 (underforecasting)
    """
    pairs = [(100.0, 90.0), (200.0, 220.0), (150.0, 150.0)]
    res = calculate_accuracy_metrics(pairs, expected_count=3)

    assert res["matchedCount"] == 3
    assert res["expectedCount"] == 3
    assert res["coveragePercentage"] == 100.0
    assert res["mae"] == 10.0
    assert res["rmse"] == 12.91
    assert res["meanBias"] == -3.33
    assert "Underforecasting" in res["biasInterpretation"]

def test_positive_bias_overforecasting():
    """Verify that when forecast exceeds actual, bias is positive and interpreted as overforecasting."""
    pairs = [(500.0, 400.0), (600.0, 500.0)]
    res = calculate_accuracy_metrics(pairs)

    assert res["mae"] == 100.0
    assert res["rmse"] == 100.0
    assert res["meanBias"] == 100.0
    assert "Overforecasting" in res["biasInterpretation"]

def test_zero_actual_generation_safety():
    """Verify that actual generation of 0.0 MW (e.g. calm wind) does not cause numerical errors."""
    pairs = [(50.0, 0.0), (0.0, 0.0)]
    res = calculate_accuracy_metrics(pairs)

    assert res["matchedCount"] == 2
    assert res["mae"] == 25.0
    assert res["rmse"] == 35.36
    assert res["meanBias"] == 25.0

def test_empty_pairs():
    """Verify graceful handling when no matched observations exist."""
    res = calculate_accuracy_metrics([], expected_count=48)

    assert res["matchedCount"] == 0
    assert res["expectedCount"] == 48
    assert res["coveragePercentage"] == 0.0
    assert res["mae"] is None
    assert res["rmse"] is None
    assert res["meanBias"] is None

def test_lead_time_bucketing():
    """Verify grouping into standard lead-time buckets."""
    observations = [
        {"leadTimeHours": 2.5, "forecastGenerationMW": 1000.0, "actualGenerationMW": 950.0}, # Intraday (1-4h)
        {"leadTimeHours": 8.0, "forecastGenerationMW": 2000.0, "actualGenerationMW": 1800.0}, # Near Day-Ahead (4-12h)
        {"leadTimeHours": 18.0, "forecastGenerationMW": 3000.0, "actualGenerationMW": 3100.0}, # Day-Ahead Auction (12-24h)
        {"leadTimeHours": 36.0, "forecastGenerationMW": 4000.0, "actualGenerationMW": 3500.0}, # Multi-Day Ahead (24-48h)
    ]

    buckets = calculate_lead_time_analytics(observations)
    assert len(buckets) == 4

    # Bucket 1: Intraday
    b1 = next(b for b in buckets if b["bucketName"] == "Intraday (1-4h)")
    assert b1["sampleCount"] == 1
    assert b1["mae"] == 50.0

    # Bucket 3: Day-Ahead Auction
    b3 = next(b for b in buckets if b["bucketName"] == "Day-Ahead Auction (12-24h)")
    assert b3["sampleCount"] == 1
    assert b3["mae"] == 100.0
    assert b3["meanBias"] == -100.0
