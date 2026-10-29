import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Header } from "../components/Header";
import { ControlBar } from "../components/ControlBar";
import { EmptyState } from "../components/EmptyState";
import { OverviewView } from "../components/OverviewView";
import type { AccuracyResponse, ForecastsResponse } from "../types";

describe("Frontend Component Suite", () => {
  it("renders Header brand and status correctly", () => {
    render(
      <Header
        health={{
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          datasetStatus: "loaded",
          totalActualRecords: 1489,
          totalForecastRecords: 19272,
        }}
        metadata={null}
        isLoading={false}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByText("UK Wind Procurement Intelligence")).toBeInTheDocument();
    expect(screen.getByText("No Look-Ahead")).toBeInTheDocument();
  });

  it("triggers callbacks on ControlBar interactions", () => {
    const handleDateChange = vi.fn();
    const handleCutoffChange = vi.fn();
    const handleTabChange = vi.fn();

    render(
      <ControlBar
        startDate="2026-01-01"
        endDate="2026-01-07"
        cutoffPreset="day_ahead_12"
        activeTab="overview"
        onDateChange={handleDateChange}
        onCutoffChange={handleCutoffChange}
        onTabChange={handleTabChange}
      />
    );

    // Click tab
    const explorerTab = screen.getByText("Forecast Explorer");
    fireEvent.click(explorerTab);
    expect(handleTabChange).toHaveBeenCalledWith("explorer");

    // Click date preset
    const presetBtn = screen.getByText("Jan 8–14");
    fireEvent.click(presetBtn);
    expect(handleDateChange).toHaveBeenCalledWith("2026-01-08", "2026-01-14");
  });

  it("renders EmptyState and triggers reset callback", () => {
    const handleReset = vi.fn();
    render(<EmptyState onReset={handleReset} />);

    expect(screen.getByText("No Wind Observations in Scope")).toBeInTheDocument();
    const btn = screen.getByText("Reset to Jan 1–7, 2026");
    fireEvent.click(btn);
    expect(handleReset).toHaveBeenCalled();
  });

  it("renders OverviewView KPI metrics accurately", () => {
    const mockForecast: ForecastsResponse = {
      startDate: "2026-01-01",
      endDate: "2026-01-01",
      cutoffPolicyApplied: "Day-Ahead 12:00 UTC",
      totalIntervals: 2,
      matchedIntervals: 2,
      intervals: [
        {
          deliveryStartTime: "2026-01-01T00:00:00Z",
          settlementPeriod: 1,
          actualGenerationMW: 10000,
          forecastGenerationMW: 10500,
          forecastPublishTime: "2025-12-31T11:30:00Z",
          leadTimeHours: 12.5,
          errorMW: 500,
          absoluteErrorMW: 500,
          isMatched: true,
        },
      ],
    };

    const mockAccuracy: AccuracyResponse = {
      startDate: "2026-01-01",
      endDate: "2026-01-01",
      cutoffPolicy: "Day-Ahead 12:00 UTC",
      generationUnit: "MW",
      matchedSampleCount: 24,
      expectedIntervalCount: 24,
      coveragePercentage: 100,
      mae: 850.5,
      rmse: 1120.4,
      meanBias: 320.0,
      biasInterpretation: "Overforecasting by 320.0 MW on average",
      dailyBreakdown: [],
    };

    render(
      <OverviewView
        forecastData={mockForecast}
        accuracyData={mockAccuracy}
        cutoffPreset="day_ahead_12"
      />
    );

    expect(screen.getByText("850.5 MW")).toBeInTheDocument();
    expect(screen.getByText("1,120.4 MW")).toBeInTheDocument();
    expect(screen.getByText("+320 MW")).toBeInTheDocument();
    expect(screen.getByText("Overforecast")).toBeInTheDocument();
  });
});
