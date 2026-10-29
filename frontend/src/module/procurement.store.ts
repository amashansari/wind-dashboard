import { create } from "zustand";
import type {
  AccuracyResponse,
  ActiveTab,
  CutoffPreset,
  DeliveryInterval,
  ForecastsResponse,
  HealthResponse,
  LeadTimesResponse,
  MetadataResponse,
  VintagesResponse,
} from "../types";

interface ProcurementState {
  // Query parameters
  startDate: string;
  endDate: string;
  cutoffPreset: CutoffPreset;
  customCutoff: string | null;
  activeTab: ActiveTab;

  // Data
  forecastData: ForecastsResponse | null;
  accuracyData: AccuracyResponse | null;
  leadTimeData: LeadTimesResponse | null;
  metadata: MetadataResponse | null;
  health: HealthResponse | null;

  // Selected interval for detail / vintage inspection
  selectedInterval: DeliveryInterval | null;
  selectedVintages: VintagesResponse | null;

  // UI state
  isLoading: boolean;
  isLoadingVintages: boolean;
  error: string | null;

  // State setters
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setCutoffPreset: (preset: CutoffPreset) => void;
  setCustomCutoff: (cutoff: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedInterval: (interval: DeliveryInterval | null) => void;
  setSelectedVintages: (vintages: VintagesResponse | null) => void;
  setForecastData: (data: ForecastsResponse | null) => void;
  setAccuracyData: (data: AccuracyResponse | null) => void;
  setLeadTimeData: (data: LeadTimesResponse | null) => void;
  setMetadata: (metadata: MetadataResponse | null) => void;
  setHealth: (health: HealthResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsLoadingVintages: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProcurementStore = create<ProcurementState>((set) => ({
  startDate: "2026-01-01",
  endDate: "2026-01-07",
  cutoffPreset: "day_ahead_12",
  customCutoff: null,
  activeTab: "overview",

  forecastData: null,
  accuracyData: null,
  leadTimeData: null,
  metadata: null,
  health: null,

  selectedInterval: null,
  selectedVintages: null,

  isLoading: false,
  isLoadingVintages: false,
  error: null,

  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setCutoffPreset: (preset) => set({ cutoffPreset: preset }),
  setCustomCutoff: (cutoff) => set({ customCutoff: cutoff }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedInterval: (interval) => set({ selectedInterval: interval }),
  setSelectedVintages: (vintages) => set({ selectedVintages: vintages }),
  setForecastData: (data) => set({ forecastData: data }),
  setAccuracyData: (data) => set({ accuracyData: data }),
  setLeadTimeData: (data) => set({ leadTimeData: data }),
  setMetadata: (metadata) => set({ metadata: metadata }),
  setHealth: (health) => set({ health: health }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsLoadingVintages: (loading) => set({ isLoadingVintages: loading }),
  setError: (error) => set({ error: error }),
}));
