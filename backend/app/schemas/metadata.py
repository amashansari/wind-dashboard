from typing import List
from pydantic import BaseModel

class CoverageRange(BaseModel):
    startDate: str
    endDate: str

class MetadataResponse(BaseModel):
    sourceActuals: str
    sourceForecasts: str
    generationUnit: str
    deliveryIntervalResolution: str
    historicalCoverage: CoverageRange
    defaultCutoffPolicy: str
    knownLimitations: List[str]
