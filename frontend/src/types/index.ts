export interface DeliveryInterval {
  deliveryStartTime: string;
  settlementPeriod: number | null;
  actualGenerationMW: number | null;
  forecastGenerationMW: number | null;
  forecastPublishTime: string | null;
  leadTimeHours: number | null;
  errorMW: number | null;
  absoluteErrorMW: number | null;
  isMatched: boolean;
}

export interface ForecastsResponse {
  startDate: string;
  endDate: string;
  cutoffPolicyApplied: string;
  totalIntervals: number;
  matchedIntervals: number;
  intervals: DeliveryInterval[];
}

export interface DailyAccuracyItem {
  date: string;
  mae: number | null;
  rmse: number | null;
  meanBias: number | null;
  matchedCount: number;
  expectedCount: number;
  coveragePercentage: number;
}

export interface AccuracyResponse {
  startDate: string;
  endDate: string;
  cutoffPolicy: string;
  generationUnit: string;
  matchedSampleCount: number;
  expectedIntervalCount: number;
  coveragePercentage: number;
  mae: number | null;
  rmse: number | null;
  meanBias: number | null;
  biasInterpretation: string;
  dailyBreakdown: DailyAccuracyItem[];
}

export interface LeadTimeBucket {
  bucketName: string;
  minLeadHours: number;
  maxLeadHours: number;
  mae: number | null;
  rmse: number | null;
  meanBias: number | null;
  sampleCount: number;
}

export interface LeadTimesResponse {
  startDate: string;
  endDate: string;
  buckets: LeadTimeBucket[];
}

export interface VintageItem {
  publishTime: string;
  leadTimeHours: number;
  forecastGenerationMW: number;
  isEligibleAtCutoff: boolean;
}

export interface VintagesResponse {
  deliveryStartTime: string;
  cutoffApplied: string;
  selectedPublishTime: string | null;
  vintages: VintageItem[];
}

export interface CoverageRange {
  startDate: string;
  endDate: string;
}

export interface MetadataResponse {
  sourceActuals: string;
  sourceForecasts: string;
  generationUnit: string;
  deliveryIntervalResolution: string;
  historicalCoverage: CoverageRange;
  defaultCutoffPolicy: string;
  knownLimitations: string[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  datasetStatus: string;
  totalActualRecords: number;
  totalForecastRecords: number;
}

export type CutoffPreset = "day_ahead_12" | "day_ahead_17" | "same_day_06";
export type ActiveTab = "overview" | "explorer" | "accuracy";
