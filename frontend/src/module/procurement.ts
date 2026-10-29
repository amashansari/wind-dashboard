import { useCallback, useEffect } from "react";
import type { CutoffPreset, DeliveryInterval } from "../types";
import {
  fetchAccuracyAction,
  fetchForecastsAction,
  fetchHealthAction,
  fetchLeadTimesAction,
  fetchMetadataAction,
  fetchVintagesAction,
} from "./procurement.action";
import { useProcurementStore } from "./procurement.store";

export function useProcurement() {
  const {
    startDate,
    endDate,
    cutoffPreset,
    customCutoff,
    activeTab,
    forecastData,
    accuracyData,
    leadTimeData,
    metadata,
    health,
    selectedInterval,
    selectedVintages,
    isLoading,
    isLoadingVintages,
    error,
    setStartDate,
    setEndDate,
    setCutoffPreset,
    setCustomCutoff,
    setActiveTab,
    setSelectedInterval,
    setSelectedVintages,
    setForecastData,
    setAccuracyData,
    setLeadTimeData,
    setMetadata,
    setHealth,
    setIsLoading,
    setIsLoadingVintages,
    setError,
  } = useProcurementStore();

  const loadInitialMetadata = useCallback(async () => {
    try {
      const [healthRes, metaRes] = await Promise.all([
        fetchHealthAction(),
        fetchMetadataAction(),
      ]);
      setHealth(healthRes);
      setMetadata(metaRes);
    } catch (err) {
      console.error("Failed to load metadata/health:", err);
    }
  }, [setHealth, setMetadata]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [forecastsRes, accuracyRes, leadTimesRes] = await Promise.all([
        fetchForecastsAction(startDate, endDate, cutoffPreset, customCutoff),
        fetchAccuracyAction(startDate, endDate, cutoffPreset, customCutoff),
        fetchLeadTimesAction(startDate, endDate, cutoffPreset),
      ]);
      setForecastData(forecastsRes);
      setAccuracyData(accuracyRes);
      setLeadTimeData(leadTimesRes);

      // Select first interval if none selected or if previously selected interval is outside new range
      if (forecastsRes.intervals.length > 0) {
        setSelectedInterval(forecastsRes.intervals[0]);
      } else {
        setSelectedInterval(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load procurement data.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    startDate,
    endDate,
    cutoffPreset,
    customCutoff,
    setIsLoading,
    setError,
    setForecastData,
    setAccuracyData,
    setLeadTimeData,
    setSelectedInterval,
  ]);

  const inspectInterval = useCallback(
    async (interval: DeliveryInterval) => {
      setSelectedInterval(interval);
      setIsLoadingVintages(true);
      try {
        const vintagesRes = await fetchVintagesAction(
          interval.deliveryStartTime,
          cutoffPreset,
          customCutoff
        );
        setSelectedVintages(vintagesRes);
      } catch (err) {
        console.error("Failed to load vintages:", err);
        setSelectedVintages(null);
      } finally {
        setIsLoadingVintages(false);
      }
    },
    [cutoffPreset, customCutoff, setSelectedInterval, setSelectedVintages, setIsLoadingVintages]
  );

  // Auto-fetch on parameter change
  useEffect(() => {
    loadInitialMetadata();
  }, [loadInitialMetadata]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected interval changes, load its vintages if in explorer tab
  useEffect(() => {
    if (selectedInterval && activeTab === "explorer" && !selectedVintages) {
      inspectInterval(selectedInterval);
    }
  }, [selectedInterval, activeTab, selectedVintages, inspectInterval]);

  const handleDateChange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleCutoffChange = (newPreset: CutoffPreset, customVal: string | null = null) => {
    setCutoffPreset(newPreset);
    setCustomCutoff(customVal);
  };

  return {
    startDate,
    endDate,
    cutoffPreset,
    customCutoff,
    activeTab,
    forecastData,
    accuracyData,
    leadTimeData,
    metadata,
    health,
    selectedInterval,
    selectedVintages,
    isLoading,
    isLoadingVintages,
    error,
    setActiveTab,
    handleDateChange,
    handleCutoffChange,
    inspectInterval,
    refreshData: loadData,
  };
}
