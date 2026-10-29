from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class DeliveryIntervalItem(BaseModel):
    deliveryStartTime: datetime
    settlementPeriod: Optional[int] = None
    actualGenerationMW: Optional[float] = None
    forecastGenerationMW: Optional[float] = None
    forecastPublishTime: Optional[datetime] = None
    leadTimeHours: Optional[float] = None
    errorMW: Optional[float] = None
    absoluteErrorMW: Optional[float] = None
    isMatched: bool = False

class ForecastsResponse(BaseModel):
    startDate: str
    endDate: str
    cutoffPolicyApplied: str
    totalIntervals: int
    matchedIntervals: int
    intervals: List[DeliveryIntervalItem]

class VintageItem(BaseModel):
    publishTime: datetime
    leadTimeHours: float
    forecastGenerationMW: float
    isEligibleAtCutoff: bool

class VintagesResponse(BaseModel):
    deliveryStartTime: datetime
    cutoffApplied: datetime
    selectedPublishTime: Optional[datetime] = None
    vintages: List[VintageItem]
