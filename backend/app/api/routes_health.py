from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.schemas.health import HealthResponse
from backend.app.schemas.metadata import MetadataResponse, CoverageRange
from backend.app.services.repository import repository
from backend.app.core.config import settings

router = APIRouter(tags=["Health & Metadata"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    dataset_status = "loaded" if repository.is_loaded else "not_loaded"
    total_actuals = len(repository.actuals)
    total_forecasts = len(repository.all_forecasts)

    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
        version=settings.VERSION,
        datasetStatus=dataset_status,
        totalActualRecords=total_actuals,
        totalForecastRecords=total_forecasts
    )

@router.get("/metadata", response_model=MetadataResponse)
def get_metadata():
    return MetadataResponse(
        sourceActuals="Elexon BMRS FUELHH/stream (fuelType=WIND)",
        sourceForecasts="Elexon BMRS WINDFOR/stream",
        generationUnit="MW",
        deliveryIntervalResolution="Half-hourly actuals, Hourly forecasts",
        historicalCoverage=CoverageRange(
            startDate="2026-01-01",
            endDate="2026-01-31"
        ),
        defaultCutoffPolicy="Day-Ahead 12:00 UTC (D-1)",
        knownLimitations=[
            "Pure wind generation dataset; no consumer demand, price, or thermal contract data is modeled.",
            "Commercial financial savings, trading profits, or optimal dispatch volumes cannot be inferred without market price curves.",
            "Raw WINDFOR forecasts are provided on hourly settlement boundaries; half-hourly intervals without forecasts are transparently preserved as null rather than synthetically interpolated."
        ]
    )
