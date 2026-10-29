from datetime import datetime, timezone
import pytest
from backend.app.analytics.selector import (
    ForecastRecord,
    select_forecast_at_cutoff,
    calculate_lead_time_hours
)

def test_select_latest_eligible_forecast():
    """Verify that among multiple eligible vintages before cutoff, the latest one is selected."""
    delivery_time = datetime(2026, 1, 2, 10, 0, 0, tzinfo=timezone.utc)
    cutoff_time = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

    vintage_1 = ForecastRecord(
        start_time=delivery_time,
        publish_time=datetime(2026, 1, 1, 2, 30, 0, tzinfo=timezone.utc),
        generation=12000.0
    )
    vintage_2 = ForecastRecord(
        start_time=delivery_time,
        publish_time=datetime(2026, 1, 1, 7, 30, 0, tzinfo=timezone.utc),
        generation=13500.0
    )
    vintage_3 = ForecastRecord(
        start_time=delivery_time,
        publish_time=datetime(2026, 1, 1, 11, 30, 0, tzinfo=timezone.utc),
        generation=14200.0
    )

    candidates = [vintage_1, vintage_3, vintage_2] # unordered list
    selected = select_forecast_at_cutoff(delivery_time, cutoff_time, candidates)

    assert selected is not None
    assert selected.publish_time == datetime(2026, 1, 1, 11, 30, 0, tzinfo=timezone.utc)
    assert selected.generation == 14200.0

def test_prevent_look_ahead_bias():
    """Verify that forecasts published AFTER the decision cutoff are strictly excluded."""
    delivery_time = datetime(2026, 1, 2, 10, 0, 0, tzinfo=timezone.utc)
    cutoff_time = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

    vintage_prior = ForecastRecord(
        start_time=delivery_time,
        publish_time=datetime(2026, 1, 1, 9, 30, 0, tzinfo=timezone.utc),
        generation=10000.0
    )
    vintage_post = ForecastRecord(
        start_time=delivery_time,
        publish_time=datetime(2026, 1, 1, 15, 30, 0, tzinfo=timezone.utc), # After cutoff!
        generation=16000.0
    )

    candidates = [vintage_prior, vintage_post]
    selected = select_forecast_at_cutoff(delivery_time, cutoff_time, candidates)

    assert selected is not None
    assert selected.publish_time == datetime(2026, 1, 1, 9, 30, 0, tzinfo=timezone.utc)
    assert selected.generation == 10000.0

def test_missing_forecast_when_all_post_cutoff():
    """Verify that if all available forecasts were published after cutoff, None is returned."""
    delivery_time = datetime(2026, 1, 2, 10, 0, 0, tzinfo=timezone.utc)
    cutoff_time = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

    vintage_post = ForecastRecord(
        start_time=delivery_time,
        publish_time=datetime(2026, 1, 1, 18, 30, 0, tzinfo=timezone.utc),
        generation=15000.0
    )

    candidates = [vintage_post]
    selected = select_forecast_at_cutoff(delivery_time, cutoff_time, candidates)

    assert selected is None

def test_lead_time_calculation():
    """Verify forecast lead time calculation in hours."""
    delivery_time = datetime(2026, 1, 2, 12, 0, 0, tzinfo=timezone.utc)
    publish_time = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    lead_time = calculate_lead_time_hours(delivery_time, publish_time)
    assert lead_time == 36.0
