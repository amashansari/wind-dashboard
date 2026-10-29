import { describe, it, expect, beforeEach } from "vitest";
import { useProcurementStore } from "../module/procurement.store";
import type { DeliveryInterval } from "../types";

describe("useProcurementStore State Management", () => {
  beforeEach(() => {
    // Reset store state
    useProcurementStore.setState({
      startDate: "2026-01-01",
      endDate: "2026-01-07",
      cutoffPreset: "day_ahead_12",
      customCutoff: null,
      activeTab: "overview",
      forecastData: null,
      accuracyData: null,
      leadTimeData: null,
      selectedInterval: null,
      selectedVintages: null,
      isLoading: false,
      error: null,
    });
  });

  it("initializes with default query parameters", () => {
    const state = useProcurementStore.getState();
    expect(state.startDate).toBe("2026-01-01");
    expect(state.endDate).toBe("2026-01-07");
    expect(state.cutoffPreset).toBe("day_ahead_12");
    expect(state.activeTab).toBe("overview");
  });

  it("updates date range correctly", () => {
    const { setStartDate, setEndDate } = useProcurementStore.getState();
    setStartDate("2026-01-08");
    setEndDate("2026-01-14");

    const updated = useProcurementStore.getState();
    expect(updated.startDate).toBe("2026-01-08");
    expect(updated.endDate).toBe("2026-01-14");
  });

  it("updates cutoff preset and custom cutoff", () => {
    const { setCutoffPreset, setCustomCutoff } = useProcurementStore.getState();
    setCutoffPreset("same_day_06");
    setCustomCutoff("2026-01-02T05:00:00Z");

    const updated = useProcurementStore.getState();
    expect(updated.cutoffPreset).toBe("same_day_06");
    expect(updated.customCutoff).toBe("2026-01-02T05:00:00Z");
  });

  it("switches active navigation tabs", () => {
    const { setActiveTab } = useProcurementStore.getState();
    setActiveTab("explorer");
    expect(useProcurementStore.getState().activeTab).toBe("explorer");

    setActiveTab("accuracy");
    expect(useProcurementStore.getState().activeTab).toBe("accuracy");
  });

  it("stores selected delivery interval", () => {
    const mockInterval: DeliveryInterval = {
      deliveryStartTime: "2026-01-01T12:00:00Z",
      settlementPeriod: 25,
      actualGenerationMW: 12500,
      forecastGenerationMW: 13000,
      forecastPublishTime: "2025-12-31T11:00:00Z",
      leadTimeHours: 25.0,
      errorMW: 500,
      absoluteErrorMW: 500,
      isMatched: true,
    };

    const { setSelectedInterval } = useProcurementStore.getState();
    setSelectedInterval(mockInterval);

    const updated = useProcurementStore.getState();
    expect(updated.selectedInterval).toEqual(mockInterval);
    expect(updated.selectedInterval?.settlementPeriod).toBe(25);
  });

  it("sets error state and clears it", () => {
    const { setError } = useProcurementStore.getState();
    setError("Failed to reach Elexon BMRS endpoint.");
    expect(useProcurementStore.getState().error).toBe("Failed to reach Elexon BMRS endpoint.");

    setError(null);
    expect(useProcurementStore.getState().error).toBeNull();
  });
});
