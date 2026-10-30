import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Zap,
  Download,
} from "lucide-react";
import type { AccuracyResponse, ForecastsResponse } from "../types";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { formatUKDateTime, formatUKTime } from "../lib/utils";

interface OverviewViewProps {
  forecastData: ForecastsResponse | null;
  accuracyData: AccuracyResponse | null;
  cutoffPreset: string;
}

export function OverviewView({ forecastData, accuracyData, cutoffPreset }: OverviewViewProps) {
  const [chartView, setChartView] = useState<"both" | "actual" | "forecast">("both");

  const chartData = useMemo(() => {
    if (!forecastData || !forecastData.intervals) return [];
    return forecastData.intervals.map((item) => {
      const timeLabel = formatUKDateTime(item.deliveryStartTime);
      return {
        rawTime: item.deliveryStartTime,
        timeLabel,
        shortTime: formatUKTime(item.deliveryStartTime),
        actual: item.actualGenerationMW,
        forecast: item.forecastGenerationMW,
        error: item.errorMW,
        absError: item.absoluteErrorMW,
        publishTime: item.forecastPublishTime
          ? formatUKDateTime(item.forecastPublishTime)
          : "N/A",
        leadTime: item.leadTimeHours !== null ? `${item.leadTimeHours}h` : "N/A",
      };
    });
  }, [forecastData]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (!forecastData || !forecastData.intervals.length) {
      return { avgActual: 0, peakActual: 0, minActual: 0, maxError: 0 };
    }
    const actuals = forecastData.intervals
      .map((i) => i.actualGenerationMW)
      .filter((v): v is number => v !== null && v !== undefined);

    const absErrors = forecastData.intervals
      .map((i) => i.absoluteErrorMW)
      .filter((v): v is number => v !== null && v !== undefined);

    const avgActual = actuals.length > 0 ? Math.round(actuals.reduce((a, b) => a + b, 0) / actuals.length) : 0;
    const peakActual = actuals.length > 0 ? Math.max(...actuals) : 0;
    const minActual = actuals.length > 0 ? Math.min(...actuals) : 0;
    const maxError = absErrors.length > 0 ? Math.max(...absErrors) : 0;

    return { avgActual, peakActual, minActual, maxError };
  }, [forecastData]);

  const maePercent = useMemo(() => {
    if (!accuracyData || !accuracyData.mae || stats.avgActual === 0) return null;
    return ((accuracyData.mae / stats.avgActual) * 100).toFixed(1);
  }, [accuracyData, stats.avgActual]);

  const rmseMaeRatio = useMemo(() => {
    if (!accuracyData?.mae || !accuracyData?.rmse) return null;
    return (accuracyData.rmse / accuracyData.mae).toFixed(2);
  }, [accuracyData]);

  const isOverforecast = (accuracyData?.meanBias ?? 0) > 0;

  // CSV Export
  const handleExportCSV = () => {
    if (!forecastData || !forecastData.intervals) return;
    const headers = [
      "Delivery Start Time (UTC)",
      "Settlement Period",
      "Actual Generation (MW)",
      "Decision-Time Forecast (MW)",
      "Forecast Publish Time (UTC)",
      "Lead Time (Hours)",
      "Signed Error (MW)",
      "Absolute Error (MW)",
    ];
    const rows = forecastData.intervals.map((i) => [
      i.deliveryStartTime,
      i.settlementPeriod ?? "",
      i.actualGenerationMW ?? "",
      i.forecastGenerationMW ?? "",
      i.forecastPublishTime ?? "",
      i.leadTimeHours ?? "",
      i.errorMW ?? "",
      i.absoluteErrorMW ?? "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `wind_procurement_${forecastData.startDate}_to_${forecastData.endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 min-w-0">
      {/* Executive Summary Card */}
      <div className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-4xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#159B76]" />
              <Badge variant="lime" className="text-[10px] font-mono py-0 font-bold uppercase tracking-wider">
                Elexon Verified 2026
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono py-0 text-[#667085] border-[#E5EAF0]">
                {forecastData?.startDate} → {forecastData?.endDate}
              </Badge>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#172033]">
              Day-Ahead Commitment &amp; Volume Risk Profile
            </h2>

            <p className="text-xs text-[#667085] leading-relaxed">
              {isOverforecast ? (
                <>
                  <strong className="text-[#172033] font-semibold">Systematic Overforecasting Warning: </strong>
                  The National Grid forecast averaged an overforecast deviation of{" "}
                  <span className="font-semibold text-[#E8A23A] font-mono tabular-nums">
                    {accuracyData?.meanBias?.toLocaleString()} MW
                  </span>{" "}
                  above realized wind generation across this period. Wholesale buyers relying strictly on Day-Ahead
                  schedules faced unhedged physical short imbalances requiring within-day cashout or balancing purchases.
                </>
              ) : (
                <>
                  <strong className="text-[#172033] font-semibold">Systematic Underforecasting Notice: </strong>
                  The day-ahead forecast averaged an underforecast deviation of{" "}
                  <span className="font-semibold text-[#3989D6] font-mono tabular-nums">
                    {Math.abs(accuracyData?.meanBias ?? 0).toLocaleString()} MW
                  </span>{" "}
                  below outturn. Realized volumes exceeded scheduled commitments, leading to spill or surplus positions.
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 gap-1.5 text-xs font-semibold"
              title="Export matched delivery intervals to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Scope and Context Status Bar */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-[#3989D6]" />
          <span className="font-semibold text-[#172033]">Delivery Horizon:</span>
          <span className="text-[#667085] font-mono tabular-nums">
            {forecastData?.startDate} 00:00 UTC → {forecastData?.endDate} 23:59 UTC
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-[#172033]">Cutoff Applied:</span>
            <Badge variant="secondary" className="font-mono text-[11px] bg-[#F5F7FA] text-[#172033] border-[#E5EAF0]">
              {forecastData?.cutoffPolicyApplied || cutoffPreset}
            </Badge>
          </div>
          <div className="flex items-center space-x-1.5 pl-3 border-l border-[#E5EAF0]">
            <span className="font-semibold text-[#172033]">Units:</span>
            <Badge variant="outline" className="font-mono text-[11px] text-[#159B76] border-emerald-200 bg-[#E9F7F1]">
              Megawatts (MW)
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Headline Bento Cards - Perfectly Aligned */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0 items-stretch">
        {/* MAE Card */}
        <Card className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs flex flex-col justify-between h-full min-h-[148px]">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Mean Absolute Error (MAE)
            </span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#3989D6] shrink-0">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-[#172033] tracking-tight tabular-nums">
              {accuracyData?.mae !== null && accuracyData?.mae !== undefined
                ? `${accuracyData.mae.toLocaleString()} MW`
                : "-- MW"}
            </div>
            <div className="flex items-center justify-between text-xs text-[#667085] pt-0.5">
              <span>{maePercent ? `${maePercent}% of avg output` : "Expected miss magnitude"}</span>
              <span className="text-[10px] font-mono font-medium tabular-nums">Avg: {stats.avgActual.toLocaleString()} MW</span>
            </div>
          </div>
        </Card>

        {/* RMSE Card */}
        <Card className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs flex flex-col justify-between h-full min-h-[148px]">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Root Mean Squared (RMSE)
            </span>
            <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#E8A23A] shrink-0">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-[#172033] tracking-tight tabular-nums">
              {accuracyData?.rmse !== null && accuracyData?.rmse !== undefined
                ? `${accuracyData.rmse.toLocaleString()} MW`
                : "-- MW"}
            </div>
            <div className="flex items-center justify-between text-xs text-[#667085] pt-0.5">
              <span>Penalizes extreme outliers</span>
              {rmseMaeRatio && (
                <span className="text-[10px] font-mono font-medium tabular-nums">Ratio: {rmseMaeRatio}x</span>
              )}
            </div>
          </div>
        </Card>

        {/* Mean Bias Card */}
        <Card className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs flex flex-col justify-between h-full min-h-[148px]">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Mean Forecast Bias
            </span>
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                isOverforecast
                  ? "bg-amber-50 border-amber-200 text-[#E8A23A]"
                  : "bg-blue-50 border-blue-200 text-[#3989D6]"
              }`}
            >
              {isOverforecast ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-[#172033] tracking-tight tabular-nums">
                {accuracyData?.meanBias !== null && accuracyData?.meanBias !== undefined
                  ? `${accuracyData.meanBias > 0 ? "+" : ""}${accuracyData.meanBias.toLocaleString()} MW`
                  : "-- MW"}
              </span>
              {accuracyData?.meanBias !== null && accuracyData?.meanBias !== undefined && (
                <Badge variant={isOverforecast ? "warning" : "secondary"} className="text-[10px] font-semibold">
                  {isOverforecast ? "Overforecast" : "Underforecast"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#667085] pt-0.5">
              Formula: (Forecast − Actual)
            </p>
          </div>
        </Card>

        {/* Sample Coverage Card */}
        <Card className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs flex flex-col justify-between h-full min-h-[148px]">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Matched Observations
            </span>
            <div className="h-9 w-9 rounded-lg bg-[#E9F7F1] border border-emerald-200 flex items-center justify-center text-[#159B76] shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold font-mono text-[#172033] tracking-tight tabular-nums">
              {accuracyData?.matchedSampleCount ?? "--"}
              <span className="text-sm font-normal text-[#667085] ml-1">
                / {accuracyData?.expectedIntervalCount ?? "--"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#667085] pt-0.5">
              <span>Hourly settlement alignment</span>
              <span className="text-[10px] font-mono font-semibold text-[#159B76] tabular-nums">
                {accuracyData?.coveragePercentage ?? 0}% Complete
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 70/30 Grid: Outturn vs Forecast Chart + Dispatch Summary Card - Equal Heights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0 items-stretch">
        {/* Main Time Series Chart (70% - 8 cols) */}
        <Card className="lg:col-span-8 rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs min-w-0 h-full flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5EAF0]">
            <div>
              <h3 className="text-base font-semibold text-[#172033]">
                National Wind Outturn vs. Day-Ahead Decision Forecast
              </h3>
              <p className="text-xs text-[#667085]">
                Realized Elexon FUELHH generation vs WINDFOR forecast published prior to cutoff.
              </p>
            </div>

            {/* Trace Toggle Controls & Legend */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg bg-[#F5F7FA] p-0.5 border border-[#E5EAF0] text-xs">
                <button
                  type="button"
                  onClick={() => setChartView("both")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    chartView === "both"
                      ? "bg-white text-[#172033] font-semibold shadow-2xs border border-[#E5EAF0]"
                      : "text-[#667085] hover:text-[#172033]"
                  }`}
                >
                  Combined
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("actual")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    chartView === "actual"
                      ? "bg-white text-[#159B76] font-semibold shadow-2xs border border-[#E5EAF0]"
                      : "text-[#667085] hover:text-[#172033]"
                  }`}
                >
                  Actual Only
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("forecast")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    chartView === "forecast"
                      ? "bg-white text-[#3989D6] font-semibold shadow-2xs border border-[#E5EAF0]"
                      : "text-[#667085] hover:text-[#172033]"
                  }`}
                >
                  Forecast Only
                </button>
              </div>

              {/* Legend Badges */}
              <div className="hidden md:flex items-center space-x-3 text-xs pl-2.5 border-l border-[#E5EAF0]">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#159B76] inline-block" />
                  <span className="font-medium text-[#172033] text-[11px]">Actual (MW)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3989D6] inline-block" />
                  <span className="font-medium text-[#172033] text-[11px]">Forecast (MW)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[340px] w-full pt-4 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.7} stroke="#E5EAF0" />
                <XAxis
                  dataKey="shortTime"
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11, fill: "#667085" }}
                  stroke="#E5EAF0"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#667085" }}
                  stroke="#E5EAF0"
                  unit=" MW"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#E5EAF0] shadow-md rounded-xl p-3 text-xs space-y-1.5 min-w-[240px]">
                          <div className="font-semibold text-[#172033] border-b border-[#E5EAF0] pb-1">
                            {data.timeLabel}
                          </div>
                          <div className="flex justify-between items-center text-[#159B76] font-medium">
                            <span>Realized Actual:</span>
                            <span className="font-mono font-bold tabular-nums">
                              {data.actual !== null ? `${data.actual.toLocaleString()} MW` : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[#3989D6] font-medium">
                            <span>Decision Forecast:</span>
                            <span className="font-mono font-bold tabular-nums">
                              {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : "N/A"}
                            </span>
                          </div>
                          {data.error !== null && (
                            <div className="flex justify-between items-center text-[#172033] font-semibold pt-1 border-t border-[#E5EAF0]">
                              <span>Signed Error (F − A):</span>
                              <span
                                className={`font-mono font-bold tabular-nums ${
                                  data.error > 0 ? "text-[#E8A23A]" : "text-[#DC6262]"
                                }`}
                              >
                                {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error.toLocaleString()} MW
                              </span>
                            </div>
                          )}
                          <div className="text-[10px] text-[#667085] pt-1 border-t border-[#E5EAF0] space-y-0.5">
                            <div>Vintage: {data.publishTime}</div>
                            <div>Horizon: {data.leadTime} prior to delivery</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {(chartView === "both" || chartView === "actual") && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Generation"
                    stroke="#159B76"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#159B76" }}
                  />
                )}
                {(chartView === "both" || chartView === "forecast") && (
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Decision Forecast"
                    stroke="#3989D6"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={false}
                    activeDot={{ r: 4, fill: "#3989D6" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Operational Dispatch Summary Card (30% - 4 cols) */}
        <Card className="lg:col-span-4 rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs min-w-0 h-full flex flex-col justify-between">
          <div className="pb-3 border-b border-[#E5EAF0]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#172033]">
                Dispatch &amp; Volatility
              </h3>
              <Badge variant="cyan" className="font-mono text-[10px]">
                {forecastData?.intervals?.length ?? 0} SPs
              </Badge>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Operational boundaries for wholesale hedging.
            </p>
          </div>

          <div className="space-y-3 pt-3 text-xs flex-1 flex flex-col justify-between">
            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] space-y-0.5">
              <span className="text-[#667085] block text-[11px] font-medium">Peak Realized Wind</span>
              <span className="text-xl font-bold font-mono text-[#159B76] tabular-nums">
                {stats.peakActual.toLocaleString()} MW
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] space-y-0.5">
              <span className="text-[#667085] block text-[11px] font-medium">Minimum Wind Outturn</span>
              <span className="text-xl font-bold font-mono text-[#3989D6] tabular-nums">
                {stats.minActual.toLocaleString()} MW
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] space-y-0.5">
              <span className="text-[#667085] block text-[11px] font-medium">Peak Single-Interval Miss</span>
              <span className="text-xl font-bold font-mono text-[#E8A23A] tabular-nums">
                {stats.maxError.toLocaleString()} MW
              </span>
            </div>

            <div className="pt-2 border-t border-[#E5EAF0] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#667085]">Error-to-Load Ratio:</span>
                <span className="font-mono font-semibold text-[#172033]">{maePercent}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#667085]">Tail Risk Multiplier:</span>
                <span className="font-mono font-semibold text-[#172033]">{rmseMaeRatio}x</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#E9F7F1] border border-emerald-200 text-[11px] text-[#172033] leading-relaxed">
              <span className="font-semibold block mb-0.5 text-[#159B76]">Procurement Strategy</span>
              High RMSE/MAE indicates heavy tail volatility; combine D-1 auction volume hedges with within-day balancing.
            </div>
          </div>
        </Card>
      </div>

      {/* Error Delta Residuals Bar Chart */}
      <Card className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5EAF0]">
          <div>
            <h3 className="text-base font-semibold text-[#172033]">
              Forecast Error Residuals (Forecast − Actual)
            </h3>
            <p className="text-xs text-[#667085]">
              Amber denotes overforecasting (volume deficit / short exposure); Red denotes underforecasting.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-[#667085]">
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E8A23A] inline-block" />
              <span className="text-[11px]">Overforecast (+)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#DC6262] inline-block" />
              <span className="text-[11px]">Underforecast (−)</span>
            </span>
          </div>
        </div>

        <div className="h-[200px] w-full pt-3 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.7} stroke="#E5EAF0" />
              <XAxis
                dataKey="shortTime"
                interval="preserveStartEnd"
                tick={{ fontSize: 11, fill: "#667085" }}
                stroke="#E5EAF0"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#667085" }}
                stroke="#E5EAF0"
                unit=" MW"
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value as number;
                    const isOver = val >= 0;
                    return (
                      <div className="bg-white border border-[#E5EAF0] shadow-md rounded-xl p-3 text-xs space-y-1 min-w-[200px]">
                        <div className="font-semibold text-[#172033] border-b border-[#E5EAF0] pb-1">
                          Delivery: {label}
                        </div>
                        <div className="flex justify-between items-center space-x-3">
                          <span className="text-[#667085]">Residual:</span>
                          <span className={`font-mono font-bold tabular-nums ${isOver ? "text-[#E8A23A]" : "text-[#DC6262]"}`}>
                            {val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString()} MW
                          </span>
                        </div>
                        <div className="text-[10px] text-[#667085]">
                          {isOver ? "Overforecast (Short Exposure)" : "Underforecast (Spill/Surplus)"}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="error" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={(entry.error ?? 0) >= 0 ? "#E8A23A" : "#DC6262"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
