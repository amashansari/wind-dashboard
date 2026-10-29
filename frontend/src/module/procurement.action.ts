import { ENDPOINTS } from "../ENDPOINT";
import type {
  AccuracyResponse,
  CutoffPreset,
  ForecastsResponse,
  HealthResponse,
  LeadTimesResponse,
  MetadataResponse,
  VintagesResponse,
} from "../types";
import { apiHandler, getQuery } from "../utils/apiHandler";

export async function fetchHealthAction(): Promise<HealthResponse> {
  return apiHandler<HealthResponse>("GET", ENDPOINTS.health);
}

export async function fetchMetadataAction(): Promise<MetadataResponse> {
  return apiHandler<MetadataResponse>("GET", ENDPOINTS.metadata);
}

export async function fetchForecastsAction(
  startDate: string,
  endDate: string,
  cutoffPreset: CutoffPreset,
  customCutoff?: string | null
): Promise<ForecastsResponse> {
  const payload = {
    startDate,
    endDate,
    cutoffPreset,
    customCutoff: customCutoff || undefined,
  };

  return apiHandler<ForecastsResponse>(
    "GET",
    ENDPOINTS.forecasts,
    getQuery(payload)
  );
}

export async function fetchAccuracyAction(
  startDate: string,
  endDate: string,
  cutoffPreset: CutoffPreset,
  customCutoff?: string | null
): Promise<AccuracyResponse> {
  const payload = {
    startDate,
    endDate,
    cutoffPreset,
    customCutoff: customCutoff || undefined,
  };

  return apiHandler<AccuracyResponse>(
    "GET",
    ENDPOINTS.accuracy,
    getQuery(payload)
  );
}

export async function fetchLeadTimesAction(
  startDate: string,
  endDate: string,
  cutoffPreset: CutoffPreset
): Promise<LeadTimesResponse> {
  const payload = {
    startDate,
    endDate,
    cutoffPreset,
  };

  return apiHandler<LeadTimesResponse>(
    "GET",
    ENDPOINTS.leadTimes,
    getQuery(payload)
  );
}

export async function fetchVintagesAction(
  deliveryTime: string,
  cutoffPreset: CutoffPreset,
  customCutoff?: string | null
): Promise<VintagesResponse> {
  const payload = {
    deliveryTime,
    cutoffPreset,
    customCutoff: customCutoff || undefined,
  };

  return apiHandler<VintagesResponse>(
    "GET",
    ENDPOINTS.vintages,
    getQuery(payload)
  );
}
