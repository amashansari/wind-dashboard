from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.services.repository import repository
from backend.app.api.routes_health import router as health_router
from backend.app.api.routes_forecasts import router as forecasts_router
from backend.app.api.routes_analytics import router as analytics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing UK Wind Procurement Intelligence API...")
    repository.load_data()
    logger.info("API initialized and ready for requests.")
    yield
    logger.info("Shutting down API...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="UK Wind Procurement Intelligence API for Day-Ahead Power Procurement Analysis (January 2026).",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes under /api
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(forecasts_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=f"{settings.API_PREFIX}/analytics")

@app.get("/")
def root():
    return {
        "message": "UK Wind Procurement Intelligence API is operational.",
        "documentation": "/docs",
        "health": f"{settings.API_PREFIX}/health",
        "metadata": f"{settings.API_PREFIX}/metadata"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
