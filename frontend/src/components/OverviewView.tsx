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
      {/* Executive Procurement Desk Briefing Banner */}
      <div className="rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 via-card to-card p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Desk Briefing: Day-Ahead Commitment &amp; Volume Risk Profile
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono py-0">
                {forecastData?.startDate} → {forecastData?.endDate}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
              {isOverforecast ? (
                <>
                  <strong className="text-foreground">Systematic Overforecasting Warning: </strong>
                  The National Grid forecast averaged an overforecast deviation of{" "}
                  <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                    {accuracyData?.meanBias?.toLocaleString()} MW
                  </span>{" "}
                  above realized wind generation across this period. Wholesale buyers relying strictly on Day-Ahead
                  schedules faced unhedged physical short imbalances requiring costly within-day cashout or balancing purchases.
                </>
              ) : (
                <>
                  <strong className="text-foreground">Systematic Underforecasting Notice: </strong>
                  The day-ahead forecast averaged an underforecast deviation of{" "}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                    {Math.abs(accuracyData?.meanBias ?? 0).toLocaleString()} MW
                  </span>{" "}
                  below outturn. Realized volumes exceeded scheduled commitments, leading to spill or surplus positions.
                </>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 gap-1.5 text-xs cursor-pointer shadow-2xs hover:bg-muted font-medium"
              title="Export matched delivery intervals to CSV"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Scope and Context Status Bar */}
      <div className="bg-card border border-border rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Delivery Horizon:</span>
          <span className="text-muted-foreground font-mono">
            {forecastData?.startDate} 00:00 UTC → {forecastData?.endDate} 23:59 UTC
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-foreground">Cutoff Applied:</span>
            <Badge variant="secondary" className="font-mono text-[11px]">
              {forecastData?.cutoffPolicyApplied || cutoffPreset}
            </Badge>
          </div>
          <div className="flex items-center space-x-1.5 pl-3 border-l border-border">
            <span className="font-semibold text-foreground">Units:</span>
            <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
              Megawatts (MW)
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MAE Card */}
        <Card className="hover:border-primary/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mean Absolute Error (MAE)
            </CardTitle>
            <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {accuracyData?.mae !== null && accuracyData?.mae !== undefined
                ? `${accuracyData.mae.toLocaleString()} MW`
                : "-- MW"}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{maePercent ? `${maePercent}% of avg output` : "Expected miss magnitude"}</span>
              <span className="text-[10px] font-mono font-medium">Avg: {stats.avgActual.toLocaleString()} MW</span>
            </div>
          </CardContent>
        </Card>

        {/* RMSE Card */}
        <Card className="hover:border-primary/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Root Mean Squared (RMSE)
            </CardTitle>
            <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {accuracyData?.rmse !== null && accuracyData?.rmse !== undefined
                ? `${accuracyData.rmse.toLocaleString()} MW`
                : "-- MW"}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Penalizes extreme tail deviations</span>
              {rmseMaeRatio && (
                <span className="text-[10px] font-mono font-medium">Ratio: {rmseMaeRatio}x</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mean Bias Card */}
        <Card className="hover:border-primary/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mean Forecast Bias
            </CardTitle>
            <div
              className={`h-8 w-8 rounded-md flex items-center justify-center ${
                isOverforecast
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
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
              <span className="text-2xl font-bold font-mono text-foreground tracking-tight">
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
            <p className="text-xs text-muted-foreground">
              Formula: (Forecast − Actual). Positive = Short Risk
            </p>
          </CardContent>
        </Card>

        {/* Sample Coverage Card */}
        <Card className="hover:border-primary/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Matched Observations
            </CardTitle>
            <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
              {accuracyData?.matchedSampleCount ?? "--"}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {accuracyData?.expectedIntervalCount ?? "--"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Hourly settlement alignment</span>
              <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {accuracyData?.coveragePercentage ?? 0}% Complete
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Time Series Chart */}
      <Card className="shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                National Wind Outturn vs. Day-Ahead Decision Forecast
              </CardTitle>
              <CardDescription className="text-xs">
                Comparing realized Elexon FUELHH generation against the latest WINDFOR forecast published prior to cutoff.
              </CardDescription>
            </div>

            {/* Trace Toggle Controls & Legend */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg bg-muted p-0.5 border border-border/50 text-xs">
                <button
                  type="button"
                  onClick={() => setChartView("both")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    chartView === "both"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Combined
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("actual")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    chartView === "actual"
                      ? "bg-card text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Actual Only
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("forecast")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    chartView === "forecast"
                      ? "bg-card text-amber-600 dark:text-amber-400 font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Forecast Only
                </button>
              </div>

              {/* Legend Badges */}
              <div className="hidden md:flex items-center space-x-3 text-xs pl-2 border-l border-border">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400 inline-block" />
                  <span className="font-medium text-foreground text-[11px]">Actual (MW)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="font-medium text-foreground text-[11px]">Forecast (MW)</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[380px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis
                  dataKey="shortTime"
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11 }}
                  stroke="#888888"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#888888"
                  unit=" MW"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border border-border shadow-xl rounded-lg p-3 text-xs space-y-1.5 min-w-[240px]">
                          <div className="font-semibold text-foreground border-b border-border pb-1">
                            {data.timeLabel}
                          </div>
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Realized Actual:</span>
                            <span className="font-mono font-bold">
                              {data.actual !== null ? `${data.actual.toLocaleString()} MW` : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-medium">
                            <span>Decision Forecast:</span>
                            <span className="font-mono font-bold">
                              {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : "N/A"}
                            </span>
                          </div>
                          {data.error !== null && (
                            <div className="flex justify-between items-center text-foreground font-semibold pt-1 border-t border-border">
                              <span>Signed Error (F − A):</span>
                              <span
                                className={`font-mono font-bold ${
                                  data.error > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {data.error > 0 ? `+${data.error.toLocaleString()}` : data.error.toLocaleString()} MW
                              </span>
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50 space-y-0.5">
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
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                )}
                {(chartView === "both" || chartView === "forecast") && (
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Decision Forecast"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Error Delta Residuals Bar Chart */}
      <Card className="shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Forecast Error Residuals (Forecast − Actual)
              </CardTitle>
              <CardDescription className="text-xs">
                Amber bars indicate overforecasting (volume deficit / short exposure); Rose bars indicate underforecasting.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded bg-amber-500 inline-block" />
                <span>Overforecast (+)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded bg-rose-500 inline-block" />
                <span>Underforecast (−)</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis
                  dataKey="shortTime"
                  interval="preserveStartEnd"
                  tick={{ fontSize: 11 }}
                  stroke="#888888"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="#888888"
                  unit=" MW"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <ReferenceLine y={0} stroke="#666666" strokeWidth={1.5} />
                <Tooltip
                  formatter={(val: unknown) => [
                    typeof val === "number"
                      ? `${val > 0 ? "+" : ""}${val.toLocaleString()} MW`
                      : "N/A",
                    "Residual Error",
                  ]}
                  labelFormatter={(label) => `Delivery: ${label}`}
                />
                <Bar dataKey="error" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(entry.error ?? 0) >= 0 ? "#f59e0b" : "#f43f5e"}
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
