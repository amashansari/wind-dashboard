import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "UK Wind Procurement Intelligence API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # CORS Origins (comma separated string or list)
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "https://*.vercel.app"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Upstream Elexon BMRS API
    ELEXON_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"
    ELEXON_REQUEST_TIMEOUT_SECONDS: int = 25
    ELEXON_MAX_RETRIES: int = 3
    
    # Data directory for cached historical datasets
    DATA_DIR: str = os.getenv(
        "DATA_DIR",
        str(Path(__file__).resolve().parent.parent.parent / "data")
    )
    
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
