import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.repository import repository

@pytest.fixture(scope="module")
def client():
    # Ensure data is loaded
    repository.load_data()
    with TestClient(app) as test_client:
        yield test_client

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["datasetStatus"] == "loaded"
    assert data["totalActualRecords"] > 0
    assert data["totalForecastRecords"] > 0

def test_metadata_endpoint(client):
    response = client.get("/api/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "FUELHH" in data["sourceActuals"]
    assert "WINDFOR" in data["sourceForecasts"]
    assert data["generationUnit"] == "MW"
    assert data["historicalCoverage"]["startDate"] == "2026-01-01"

def test_forecasts_endpoint(client):
    response = client.get("/api/forecasts?startDate=2026-01-01&endDate=2026-01-02&cutoffPreset=day_ahead_12")
    assert response.status_code == 200
    data = response.json()
    assert data["startDate"] == "2026-01-01"
    assert data["endDate"] == "2026-01-02"
    assert data["totalIntervals"] > 0
    assert data["matchedIntervals"] > 0
    # Check interval item structure
    sample = data["intervals"][0]
    assert "deliveryStartTime" in sample
    assert "actualGenerationMW" in sample

def test_accuracy_endpoint(client):
    response = client.get("/api/analytics/accuracy?startDate=2026-01-01&endDate=2026-01-03&cutoffPreset=day_ahead_12")
    assert response.status_code == 200
    data = response.json()
    assert data["generationUnit"] == "MW"
    assert data["matchedSampleCount"] > 0
    assert data["mae"] is not None
    assert data["rmse"] is not None
    assert data["meanBias"] is not None
    assert len(data["dailyBreakdown"]) == 3

def test_lead_times_endpoint(client):
    response = client.get("/api/analytics/lead-times?startDate=2026-01-01&endDate=2026-01-07")
    assert response.status_code == 200
    data = response.json()
    assert len(data["buckets"]) > 0

def test_vintages_endpoint(client):
    response = client.get("/api/vintages?deliveryTime=2026-01-01T12:00:00Z&cutoffPreset=day_ahead_12")
    assert response.status_code == 200
    data = response.json()
    assert "vintages" in data
    assert len(data["vintages"]) > 0
    # Check that isEligibleAtCutoff is boolean
    assert isinstance(data["vintages"][0]["isEligibleAtCutoff"], bool)
