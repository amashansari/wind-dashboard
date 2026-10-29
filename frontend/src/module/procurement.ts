import { useCallback, useEffect, useRef } from "react";
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

  // Race condition guards for concurrent async dispatches
  const dataRequestIdRef = useRef<number>(0);
  const vintageRequestIdRef = useRef<number>(0);

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
    const currentRequestId = ++dataRequestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const [forecastsRes, accuracyRes, leadTimesRes] = await Promise.all([
        fetchForecastsAction(startDate, endDate, cutoffPreset, customCutoff),
        fetchAccuracyAction(startDate, endDate, cutoffPreset, customCutoff),
        fetchLeadTimesAction(startDate, endDate, cutoffPreset),
      ]);

      // Guard against stale response if a newer query was initiated in the meantime
      if (currentRequestId !== dataRequestIdRef.current) {
        return;
      }

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
      if (currentRequestId !== dataRequestIdRef.current) {
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to load procurement data.";
      setError(msg);
    } finally {
      if (currentRequestId === dataRequestIdRef.current) {
        setIsLoading(false);
      }
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
      const currentVintageReq = ++vintageRequestIdRef.current;
      setSelectedInterval(interval);
      setIsLoadingVintages(true);

      try {
        const vintagesRes = await fetchVintagesAction(
          interval.deliveryStartTime,
          cutoffPreset,
          customCutoff
        );

        if (currentVintageReq !== vintageRequestIdRef.current) {
          return;
        }

        setSelectedVintages(vintagesRes);
      } catch (err) {
        if (currentVintageReq !== vintageRequestIdRef.current) {
          return;
        }
        console.error("Failed to load vintages:", err);
        setSelectedVintages(null);
      } finally {
        if (currentVintageReq === vintageRequestIdRef.current) {
          setIsLoadingVintages(false);
        }
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
