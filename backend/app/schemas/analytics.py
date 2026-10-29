from typing import List, Optional
from pydantic import BaseModel

class DailyAccuracyItem(BaseModel):
    date: str
    mae: Optional[float] = None
    rmse: Optional[float] = None
    meanBias: Optional[float] = None
    matchedCount: int
    expectedCount: int
    coveragePercentage: float

class AccuracyResponse(BaseModel):
    startDate: str
    endDate: str
    cutoffPolicy: str
    generationUnit: str
    matchedSampleCount: int
    expectedIntervalCount: int
    coveragePercentage: float
    mae: Optional[float] = None
    rmse: Optional[float] = None
    meanBias: Optional[float] = None
    biasInterpretation: str
    dailyBreakdown: List[DailyAccuracyItem]

class LeadTimeBucketItem(BaseModel):
    bucketName: str
    minLeadHours: float
    maxLeadHours: float
    mae: Optional[float] = None
    rmse: Optional[float] = None
    meanBias: Optional[float] = None
    sampleCount: int

class LeadTimesResponse(BaseModel):
    startDate: str
    endDate: str
    buckets: List[LeadTimeBucketItem]
