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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
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
    <div className="space-y-6">
      {/* Executive Procurement Atmospheric Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 bg-linear-to-br from-white via-emerald-50/25 to-cyan-50/20 dark:from-[#14283A] dark:via-[#0B1220] dark:to-[#14283A] p-6 sm:p-7 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl">
        {/* Ambient atmospheric glow highlights */}
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#16A477] shadow-[0_0_10px_#16A477] animate-pulse" />
              <Badge variant="lime" className="text-[10px] font-mono py-0 font-bold uppercase tracking-wider">
                Elexon Verified 2026
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono py-0 text-slate-500 dark:text-muted-foreground border-slate-200/80 dark:border-border/60">
                {forecastData?.startDate} → {forecastData?.endDate}
              </Badge>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground flex items-center gap-2">
              Desk Briefing: Day-Ahead Commitment &amp; Volume Risk Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground/90 font-medium">
              Smarter forecasts. Better decisions. A more sustainable tomorrow.
            </p>

            <p className="text-xs text-slate-600 dark:text-muted-foreground leading-relaxed pt-1">
              {isOverforecast ? (
                <>
                  <strong className="text-slate-900 dark:text-foreground">Systematic Overforecasting Warning: </strong>
                  The National Grid forecast averaged an overforecast deviation of{" "}
                  <span className="font-semibold text-[#D97706] dark:text-[#F5B84B] font-mono tabular-nums">
                    {accuracyData?.meanBias?.toLocaleString()} MW
                  </span>{" "}
                  above realized wind generation across this period. Wholesale buyers relying strictly on Day-Ahead
                  schedules faced unhedged physical short imbalances requiring costly within-day cashout or balancing purchases.
                </>
              ) : (
                <>
                  <strong className="text-slate-900 dark:text-foreground">Systematic Underforecasting Notice: </strong>
                  The day-ahead forecast averaged an underforecast deviation of{" "}
                  <span className="font-semibold text-[#0284c7] dark:text-[#59C8E8] font-mono tabular-nums">
                    {Math.abs(accuracyData?.meanBias ?? 0).toLocaleString()} MW
                  </span>{" "}
                  below outturn. Realized volumes exceeded scheduled commitments, leading to spill or surplus positions.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
            <Button
              variant="emerald"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-2 text-xs font-semibold cursor-pointer shadow-[0_0_20px_rgba(22,164,119,0.3)]"
              title="Export matched delivery intervals to CSV"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Scope and Context Status Bar */}
      <div className="bg-white dark:bg-[#14283A]/80 backdrop-blur-md border border-slate-200/80 dark:border-border/60 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs dark:shadow-inner">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-[#0284c7] dark:text-[#59C8E8]" />
          <span className="font-semibold text-slate-900 dark:text-white">Delivery Horizon:</span>
          <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {forecastData?.startDate} 00:00 UTC → {forecastData?.endDate} 23:59 UTC
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-900 dark:text-white">Cutoff Applied:</span>
            <Badge variant="secondary" className="font-mono text-[11px] bg-slate-100 dark:bg-[#0B1220] text-slate-900 dark:text-white border-slate-200/80 dark:border-slate-700">
              {forecastData?.cutoffPolicyApplied || cutoffPreset}
            </Badge>
          </div>
          <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200/80 dark:border-border/60">
            <span className="font-semibold text-slate-900 dark:text-white">Units:</span>
            <Badge variant="outline" className="font-mono text-[11px] text-emerald-700 dark:text-[#B7F36B] border-emerald-500/30">
              Megawatts (MW)
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Headline Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MAE Card */}
        <Card className="hover:border-[#0284c7]/40 dark:hover:border-[#59C8E8]/40 border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md transition-all shadow-xs dark:shadow-lg hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(89,200,232,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mean Absolute Error (MAE)
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#0284c7] dark:text-[#59C8E8]">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
              {accuracyData?.mae !== null && accuracyData?.mae !== undefined
                ? `${accuracyData.mae.toLocaleString()} MW`
                : "-- MW"}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{maePercent ? `${maePercent}% of avg output` : "Expected miss magnitude"}</span>
              <span className="text-[10px] font-mono font-medium tabular-nums">Avg: {stats.avgActual.toLocaleString()} MW</span>
            </div>
          </CardContent>
        </Card>

        {/* RMSE Card */}
        <Card className="hover:border-amber-500/40 dark:hover:border-[#F5B84B]/40 border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md transition-all shadow-xs dark:shadow-lg hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(245,184,75,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Root Mean Squared (RMSE)
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-[#F5B84B]">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
              {accuracyData?.rmse !== null && accuracyData?.rmse !== undefined
                ? `${accuracyData.rmse.toLocaleString()} MW`
                : "-- MW"}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Penalizes extreme tail deviations</span>
              {rmseMaeRatio && (
                <span className="text-[10px] font-mono font-medium tabular-nums">Ratio: {rmseMaeRatio}x</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mean Bias Card */}
        <Card className="hover:border-emerald-500/40 dark:hover:border-[#16A477]/40 border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md transition-all shadow-xs dark:shadow-lg hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(22,164,119,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mean Forecast Bias
            </CardTitle>
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center border ${
                isOverforecast
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-[#F5B84B]"
                  : "bg-cyan-500/10 border-cyan-500/20 text-[#0284c7] dark:text-[#59C8E8]"
              }`}
            >
              {isOverforecast ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formula: (Forecast − Actual). Positive = Short Risk
            </p>
          </CardContent>
        </Card>

        {/* Sample Coverage Card */}
        <Card className="hover:border-lime-500/40 dark:hover:border-[#B7F36B]/40 border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md transition-all shadow-xs dark:shadow-lg hover:shadow-md dark:hover:shadow-[0_4px_24px_rgba(183,243,107,0.15)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Matched Observations
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-700 dark:text-[#B7F36B]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
              {accuracyData?.matchedSampleCount ?? "--"}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">
                / {accuracyData?.expectedIntervalCount ?? "--"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Hourly settlement alignment</span>
              <span className="text-[10px] font-mono font-semibold text-[#16A477] tabular-nums">
                {accuracyData?.coveragePercentage ?? 0}% Complete
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 70/30 Grid: Outturn vs Forecast Chart + Dispatch Summary Bento Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Time Series Chart (70% - 8 cols) */}
        <Card className="lg:col-span-8 shadow-xs dark:shadow-xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  National Wind Outturn vs. Day-Ahead Decision Forecast
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Comparing realized Elexon FUELHH generation against the latest WINDFOR forecast published prior to cutoff.
                </CardDescription>
              </div>

              {/* Trace Toggle Controls & Legend */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-[#0B1220]/80 p-0.5 border border-slate-200/80 dark:border-border/50 text-xs shadow-inner">
                  <button
                    type="button"
                    onClick={() => setChartView("both")}
                    className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                      chartView === "both"
                        ? "bg-white dark:bg-[#14283A] text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200/80 dark:border-slate-700"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Combined
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView("actual")}
                    className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                      chartView === "actual"
                        ? "bg-white dark:bg-[#14283A] text-[#16A477] font-semibold shadow-xs border border-slate-200/80 dark:border-slate-700"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Actual Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartView("forecast")}
                    className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                      chartView === "forecast"
                        ? "bg-white dark:bg-[#14283A] text-[#0284c7] dark:text-[#59C8E8] font-semibold shadow-xs border border-slate-200/80 dark:border-slate-700"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Forecast Only
                  </button>
                </div>

                {/* Legend Badges */}
                <div className="hidden md:flex items-center space-x-3 text-xs pl-2.5 border-l border-slate-200/80 dark:border-border/60">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#16A477] inline-block shadow-[0_0_8px_#16A477]" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">Actual (MW)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0284c7] dark:bg-[#59C8E8] inline-block shadow-[0_0_8px_rgba(2,132,199,0.5)]" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">Forecast (MW)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[380px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="currentColor" className="text-slate-300 dark:text-slate-700" />
                  <XAxis
                    dataKey="shortTime"
                    interval="preserveStartEnd"
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-slate-500 dark:text-slate-400"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    className="text-slate-500 dark:text-slate-400"
                    unit=" MW"
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 shadow-2xl rounded-2xl p-4 text-xs space-y-2 min-w-[260px]">
                            <div className="font-semibold text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-border/60 pb-1.5">
                              {data.timeLabel}
                            </div>
                            <div className="flex justify-between items-center text-[#16A477] font-medium">
                              <span>Realized Actual:</span>
                              <span className="font-mono font-bold tabular-nums">
                                {data.actual !== null ? `${data.actual.toLocaleString()} MW` : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[#0284c7] dark:text-[#59C8E8] font-medium">
                              <span>Decision Forecast:</span>
                              <span className="font-mono font-bold tabular-nums">
                                {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : "N/A"}
                              </span>
                            </div>
                            {data.error !== null && (
                              <div className="flex justify-between items-center text-slate-900 dark:text-white font-semibold pt-1 border-t border-slate-200/80 dark:border-border/60">
                                <span>Signed Error (F − A):</span>
                                <span
                                  className={`font-mono font-bold tabular-nums ${
                                    data.error > 0 ? "text-[#D97706] dark:text-[#F5B84B]" : "text-[#E11D48] dark:text-[#FF5A76]"
                                  }`}
                                >
                                  {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error.toLocaleString()} MW
                                </span>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/80 dark:border-border/40 space-y-0.5">
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
                      stroke="#16A477"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: "#16A477" }}
                    />
                  )}
                  {(chartView === "both" || chartView === "forecast") && (
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Decision Forecast"
                      stroke="#0284c7"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      dot={false}
                      activeDot={{ r: 5, fill: "#0284c7" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operational Dispatch Summary Bento Card (30% - 4 cols) */}
        <Card className="lg:col-span-4 shadow-xs dark:shadow-xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Dispatch &amp; Volatility Profile</span>
              <Badge variant="cyan" className="font-mono text-[10px]">
                {forecastData?.intervals?.length ?? 0} SPs
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Key operational boundaries and deviation metrics for wholesale hedging.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1220]/80 border border-slate-200/80 dark:border-border/50 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Peak Realized Wind</span>
              <span className="text-lg font-bold font-mono text-[#16A477] tabular-nums">
                {stats.peakActual.toLocaleString()} MW
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1220]/80 border border-slate-200/80 dark:border-border/50 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Minimum Wind Outturn</span>
              <span className="text-lg font-bold font-mono text-[#0284c7] dark:text-[#59C8E8] tabular-nums">
                {stats.minActual.toLocaleString()} MW
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1220]/80 border border-slate-200/80 dark:border-border/50 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Peak Single-Interval Miss</span>
              <span className="text-lg font-bold font-mono text-[#D97706] dark:text-[#F5B84B] tabular-nums">
                {stats.maxError.toLocaleString()} MW
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/80 dark:border-border/60 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Error-to-Load Ratio:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{maePercent}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Tail Risk Multiplier:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{rmseMaeRatio}x</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Procurement Desk Strategy</span>
              High RMSE/MAE indicates heavy tail volatility; combine D-1 auction volume hedges with within-day continuous balancing.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Delta Residuals Bar Chart */}
      <Card className="shadow-xs dark:shadow-xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                Forecast Error Residuals (Forecast − Actual)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Amber bars indicate overforecasting (volume deficit / short exposure); Rose bars indicate underforecasting.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D97706] dark:bg-[#F5B84B] inline-block shadow-[0_0_6px_#F5B84B]" />
                <span className="text-[11px]">Overforecast (+)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E11D48] dark:bg-[#FF5A76] inline-block shadow-[0_0_6px_#FF5A76]" />
                <span className="text-[11px]">Underforecast (−)</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="currentColor" className="text-slate-300 dark:text-slate-700" />
                <XAxis
                  dataKey="shortTime"
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-slate-500 dark:text-slate-400"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-slate-500 dark:text-slate-400"
                  unit=" MW"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <ReferenceLine y={0} stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth={1} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number;
                      const isOver = val >= 0;
                      return (
                        <div className="bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 shadow-2xl rounded-2xl p-3.5 text-xs space-y-1 min-w-[220px]">
                          <div className="font-semibold text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-border/60 pb-1">
                            Delivery: {label}
                          </div>
                          <div className="flex justify-between items-center space-x-3">
                            <span className="text-slate-500 dark:text-slate-400">Residual Error:</span>
                            <span className={`font-mono font-bold tabular-nums ${isOver ? "text-[#D97706] dark:text-[#F5B84B]" : "text-[#E11D48] dark:text-[#FF5A76]"}`}>
                              {val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString()} MW
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isOver ? "Overforecast (Short Exposure)" : "Underforecast (Spill/Surplus)"}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="error" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(entry.error ?? 0) >= 0 ? "#F5B84B" : "#FF5A76"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
