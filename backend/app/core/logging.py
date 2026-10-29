import logging
import sys
from backend.app.core.config import settings

def setup_logging():
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True
    )
    # Silence noisy third-party loggers if needed
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    return logging.getLogger("wind_procurement")

logger = setup_logging()
