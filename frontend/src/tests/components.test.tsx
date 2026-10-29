import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Header } from "../components/Header";
import { ControlBar } from "../components/ControlBar";
import { EmptyState } from "../components/EmptyState";
import { OverviewView } from "../components/OverviewView";
import { AccuracyAnalysisView } from "../components/AccuracyAnalysisView";
import { ForecastExplorerView } from "../components/ForecastExplorerView";
import type { AccuracyResponse, ForecastsResponse, LeadTimesResponse, VintagesResponse } from "../types";

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

  it("renders AccuracyAnalysisView methodology and daily audit table", () => {
    const mockAccuracy: AccuracyResponse = {
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      cutoffPolicy: "Day-Ahead 12:00 UTC",
      generationUnit: "MW",
      matchedSampleCount: 48,
      expectedIntervalCount: 48,
      coveragePercentage: 100,
      mae: 750.0,
      rmse: 920.0,
      meanBias: 150.0,
      biasInterpretation: "Overforecasting by 150.0 MW on average",
      dailyBreakdown: [
        {
          date: "2026-01-01",
          mae: 700.0,
          rmse: 850.0,
          meanBias: 120.0,
          matchedCount: 24,
          expectedCount: 24,
          coveragePercentage: 100.0,
        },
        {
          date: "2026-01-02",
          mae: 800.0,
          rmse: 990.0,
          meanBias: 180.0,
          matchedCount: 24,
          expectedCount: 24,
          coveragePercentage: 100.0,
        },
      ],
    };

    const mockLeadTime: LeadTimesResponse = {
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      buckets: [
        {
          bucketName: "Intraday (1-4h)",
          minLeadHours: 0.0,
          maxLeadHours: 4.0,
          mae: 350.0,
          rmse: 420.0,
          meanBias: 50.0,
          sampleCount: 12,
        },
        {
          bucketName: "Multi-Day Ahead (>24h)",
          minLeadHours: 24.0,
          maxLeadHours: 999.0,
          mae: 1400.0,
          rmse: 1750.0,
          meanBias: 300.0,
          sampleCount: 12,
        },
      ],
    };

    render(
      <AccuracyAnalysisView
        accuracyData={mockAccuracy}
        leadTimeData={mockLeadTime}
      />
    );

    expect(screen.getByText("Methodological Standards & Market Boundary Disclosures")).toBeInTheDocument();
    expect(screen.getByText(/Exclusion of MAPE/)).toBeInTheDocument();
    expect(screen.getByText("Best Forecast Day")).toBeInTheDocument();
    expect(screen.getByText("4.0x Expansion")).toBeInTheDocument();
  });

  it("renders ForecastExplorerView and supports interval filtering", () => {
    const mockForecast: ForecastsResponse = {
      startDate: "2026-01-01",
      endDate: "2026-01-01",
      cutoffPolicyApplied: "Day-Ahead 12:00 UTC",
      totalIntervals: 2,
      matchedIntervals: 2,
      intervals: [
        {
          deliveryStartTime: "2026-01-01T08:00:00Z",
          settlementPeriod: 17,
          actualGenerationMW: 9000,
          forecastGenerationMW: 9500,
          forecastPublishTime: "2025-12-31T11:00:00Z",
          leadTimeHours: 21.0,
          errorMW: 500,
          absoluteErrorMW: 500,
          isMatched: true,
        },
        {
          deliveryStartTime: "2026-01-01T20:00:00Z",
          settlementPeriod: 41,
          actualGenerationMW: 14000,
          forecastGenerationMW: 14200,
          forecastPublishTime: "2025-12-31T11:00:00Z",
          leadTimeHours: 33.0,
          errorMW: 200,
          absoluteErrorMW: 200,
          isMatched: true,
        },
      ],
    };

    const mockVintages: VintagesResponse = {
      deliveryStartTime: "2026-01-01T08:00:00Z",
      cutoffApplied: "2025-12-31T12:00:00Z",
      selectedPublishTime: "2025-12-31T11:00:00Z",
      vintages: [
        {
          publishTime: "2025-12-31T11:00:00Z",
          leadTimeHours: 21.0,
          forecastGenerationMW: 9500,
          isEligibleAtCutoff: true,
        },
      ],
    };

    const handleSelectInterval = vi.fn();

    render(
      <ForecastExplorerView
        forecastData={mockForecast}
        selectedInterval={mockForecast.intervals[0]}
        selectedVintages={mockVintages}
        isLoadingVintages={false}
        onSelectInterval={handleSelectInterval}
      />
    );

    expect(screen.getByText("Forecast Vintage Traceability & Gate-Closure Guard")).toBeInTheDocument();
    expect(screen.getByText("Settlement Period 17")).toBeInTheDocument();

    // Test filter input
    const filterInput = screen.getByPlaceholderText(/Filter by date or period/);
    fireEvent.change(filterInput, { target: { value: "41" } });
    expect(screen.queryByText(/SP 17/)).not.toBeInTheDocument();
    expect(screen.getByText(/SP 41/)).toBeInTheDocument();
  });
});
