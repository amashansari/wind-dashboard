import { useMemo } from "react";
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
} from "recharts";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { AccuracyResponse, ForecastsResponse } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatUKDateTime, formatUKTime } from "../lib/utils";

interface OverviewViewProps {
  forecastData: ForecastsResponse | null;
  accuracyData: AccuracyResponse | null;
  cutoffPreset: string;
}

export function OverviewView({ forecastData, accuracyData, cutoffPreset }: OverviewViewProps) {
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

  const averageActual = useMemo(() => {
    if (!forecastData) return 0;
    const vals = forecastData.intervals
      .map((i) => i.actualGenerationMW)
      .filter((v): v is number => v !== null && v !== undefined);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [forecastData]);

  const maePercent = useMemo(() => {
    if (!accuracyData || !accuracyData.mae || averageActual === 0) return null;
    return ((accuracyData.mae / averageActual) * 100).toFixed(1);
  }, [accuracyData, averageActual]);

  const isOverforecast = (accuracyData?.meanBias ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Scope and Context Banner */}
      <div className="bg-muted/50 border border-border rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Delivery Scope:</span>
          <span className="text-muted-foreground font-mono">
            {forecastData?.startDate} to {forecastData?.endDate}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-foreground">Decision Cutoff:</span>
          <Badge variant="secondary" className="font-mono text-[11px]">
            {forecastData?.cutoffPolicyApplied || cutoffPreset}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-foreground">Unit:</span>
          <Badge variant="outline" className="font-mono text-[11px]">
            Megawatts (MW)
          </Badge>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MAE Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mean Absolute Error (MAE)
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {accuracyData?.mae !== null && accuracyData?.mae !== undefined
                ? `${accuracyData.mae.toLocaleString()} MW`
                : "-- MW"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {maePercent ? `${maePercent}% of avg wind generation` : "Average forecast miss magnitude"}
            </p>
          </CardContent>
        </Card>

        {/* RMSE Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Root Mean Squared (RMSE)
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {accuracyData?.rmse !== null && accuracyData?.rmse !== undefined
                ? `${accuracyData.rmse.toLocaleString()} MW`
                : "-- MW"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Penalizes extreme tail forecast errors
            </p>
          </CardContent>
        </Card>

        {/* Mean Bias Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mean Forecast Bias
            </CardTitle>
            {isOverforecast ? (
              <TrendingUp className="h-4 w-4 text-rose-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-indigo-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold font-mono text-foreground">
                {accuracyData?.meanBias !== null && accuracyData?.meanBias !== undefined
                  ? `${accuracyData.meanBias > 0 ? "+" : ""}${accuracyData.meanBias.toLocaleString()} MW`
                  : "-- MW"}
              </span>
              {accuracyData?.meanBias !== null && accuracyData?.meanBias !== undefined && (
                <Badge variant={isOverforecast ? "warning" : "secondary"}>
                  {isOverforecast ? "Overforecast" : "Underforecast"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              error = forecast - actual (positive = overforecast)
            </p>
          </CardContent>
        </Card>

        {/* Sample Coverage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Matched Observations
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {accuracyData?.matchedSampleCount ?? "--"}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {accuracyData?.expectedIntervalCount ?? "--"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Coverage: {accuracyData?.coveragePercentage ?? 0}% (Hourly pairs)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Time Series Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Actual Generation vs. Decision-Time Wind Forecast
              </CardTitle>
              <CardDescription className="text-xs">
                Comparing realized national wind power output against the latest forecast vintage available at cutoff.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                <span className="font-medium text-foreground">Actual Generation (MW)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                <span className="font-medium text-foreground">Decision-Time Forecast (MW)</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
                        <div className="bg-card border border-border shadow-lg rounded-lg p-3 text-xs space-y-1.5 min-w-[220px]">
                          <div className="font-semibold text-foreground border-b border-border pb-1">
                            {data.timeLabel}
                          </div>
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Actual Generation:</span>
                            <span className="font-mono">
                              {data.actual !== null ? `${data.actual.toLocaleString()} MW` : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-medium">
                            <span>Decision-Time Forecast:</span>
                            <span className="font-mono">
                              {data.forecast !== null ? `${data.forecast.toLocaleString()} MW` : "N/A"}
                            </span>
                          </div>
                          {data.error !== null && (
                            <div className="flex justify-between items-center text-foreground font-semibold pt-1 border-t border-border">
                              <span>Error (F - A):</span>
                              <span className={`font-mono ${data.error > 0 ? "text-amber-600" : "text-rose-600"}`}>
                                {data.error > 0 ? `+${data.error}` : data.error} MW
                              </span>
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                            Vintage: {data.publishTime} ({data.leadTime} lead)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual (MW)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast (MW)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Error Delta Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Forecast Error Residuals (Forecast - Actual)
          </CardTitle>
          <CardDescription className="text-xs">
            Positive bars indicate overforecasting (volume surplus); negative bars indicate underforecasting (volume deficit).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
                />
                <ReferenceLine y={0} stroke="#666666" strokeWidth={1.5} />
                <Tooltip
                  formatter={(val: unknown) => [
                    typeof val === "number" ? `${val > 0 ? "+" : ""}${val.toLocaleString()} MW` : "N/A",
                    "Error Delta",
                  ]}
                  labelFormatter={(label) => `Delivery: ${label}`}
                />
                <Bar
                  dataKey="error"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
