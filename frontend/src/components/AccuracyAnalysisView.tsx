import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  ShieldCheck,
  Download,
  AlertTriangle,
  Award,
  TrendingUp,
} from "lucide-react";
import type { AccuracyResponse, LeadTimesResponse } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface AccuracyAnalysisViewProps {
  accuracyData: AccuracyResponse | null;
  leadTimeData: LeadTimesResponse | null;
}

export function AccuracyAnalysisView({
  accuracyData,
  leadTimeData,
}: AccuracyAnalysisViewProps) {
  const dailyData = accuracyData?.dailyBreakdown || [];
  const buckets = leadTimeData?.buckets || [];

  // Summary statistics across days
  const dailyStats = useMemo(() => {
    if (!dailyData.length) return null;
    const sortedByMae = [...dailyData]
      .filter((d) => d.mae !== null)
      .sort((a, b) => (a.mae ?? 0) - (b.mae ?? 0));

    const bestDay = sortedByMae[0] || null;
    const worstDay = sortedByMae[sortedByMae.length - 1] || null;

    // Horizon error multiplier
    const intraday = buckets.find((b) => b.minLeadHours <= 1 && b.maxLeadHours <= 4);
    const multiday = buckets.find((b) => b.minLeadHours >= 24);
    const degradationMultiplier =
      intraday && multiday && intraday.mae && multiday.mae
        ? (multiday.mae / intraday.mae).toFixed(1)
        : null;

    return { bestDay, worstDay, degradationMultiplier };
  }, [dailyData, buckets]);

  // CSV Export for Daily Table
  const handleExportDailyCSV = () => {
    if (!dailyData.length) return;
    const headers = [
      "Date",
      "MAE (MW)",
      "RMSE (MW)",
      "Mean Bias (MW)",
      "Bias Direction",
      "Matched Pair Count",
      "Expected Interval Count",
      "Coverage (%)",
    ];
    const rows = dailyData.map((d) => [
      d.date,
      d.mae ?? "",
      d.rmse ?? "",
      d.meanBias ?? "",
      d.meanBias !== null ? (d.meanBias > 0 ? "Overforecast" : "Underforecast") : "",
      d.matchedCount,
      d.expectedCount,
      d.coveragePercentage,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_forecast_accuracy_${dailyData[0]?.date}_to_${dailyData[dailyData.length - 1]?.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Methodology Standards & Market Boundary Disclosures */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 bg-linear-to-br from-white via-emerald-50/25 to-cyan-50/20 dark:from-[#14283A] dark:via-[#0B1220] dark:to-[#14283A] p-6 text-xs shadow-md dark:shadow-xl backdrop-blur-xl">
        <div className="flex items-start space-x-3.5 relative z-10">
          <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-700 dark:text-[#59C8E8] shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                Methodological Standards &amp; Market Boundary Disclosures
              </h4>
              <Badge variant="lime" className="text-[10px] font-mono py-0 font-semibold">
                Governance
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <p>
                  <strong className="text-slate-900 dark:text-white font-semibold">Error Convention:</strong> All error deltas follow{" "}
                  <code className="text-emerald-700 dark:text-[#59C8E8] font-mono font-semibold bg-slate-100 dark:bg-[#0B1220]/80 border border-slate-200 dark:border-border/60 px-1.5 py-0.5 rounded-md">
                    error = forecast − actual
                  </code>
                  . Positive bias denotes systematic overforecasting (procurement risk: volume shortage requiring within-day spot balance).
                  Negative bias denotes underforecasting (volume surplus).
                </p>
              </div>
              <div>
                <p>
                  <strong className="text-slate-900 dark:text-white font-semibold">Exclusion of MAPE:</strong> Mean Absolute Percentage Error (MAPE)
                  is purposefully omitted from headline metrics because dividing by realized wind output when generation
                  approaches zero creates mathematical singularities and misleading percentage spikes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {dailyStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-md dark:shadow-xl hover:border-emerald-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                Best Forecast Day
              </CardTitle>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-[#16A477]">
                <Award className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {dailyStats.bestDay?.date ?? "--"}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Lowest MAE:{" "}
                <span className="font-semibold text-emerald-600 dark:text-[#16A477] font-mono tabular-nums">
                  {dailyStats.bestDay?.mae?.toLocaleString()} MW
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-md dark:shadow-xl hover:border-rose-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                Highest Volatility Day
              </CardTitle>
              <div className="h-8 w-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-[#FF5A76]">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {dailyStats.worstDay?.date ?? "--"}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Peak MAE:{" "}
                <span className="font-semibold text-rose-600 dark:text-[#FF5A76] font-mono tabular-nums">
                  {dailyStats.worstDay?.mae?.toLocaleString()} MW
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-md dark:shadow-xl hover:border-amber-500/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                Lead-Time Degradation
              </CardTitle>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-[#F5B84B]">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {dailyStats.degradationMultiplier ? `${dailyStats.degradationMultiplier}x Expansion` : "--"}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Error growth from Intraday (1–4h) to Multi-Day (&gt;24h)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid: Daily Accuracy Performance and Lead Time Decay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Accuracy Breakdown Chart */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-md dark:shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  Daily Accuracy Trend (MAE &amp; RMSE)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Tracking daily forecast deviation and volatility magnitude across time.
                </CardDescription>
              </div>
              <Badge variant="cyan" className="text-xs font-mono tabular-nums">
                {dailyData.length} Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="currentColor" className="text-slate-300 dark:text-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-slate-500 dark:text-muted-foreground"
                    tickFormatter={(d) => d.slice(5)} // MM-DD
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-slate-500 dark:text-muted-foreground"
                    unit=" MW"
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 shadow-2xl rounded-2xl p-3.5 text-xs space-y-1.5 min-w-[200px]">
                            <div className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-border/60 pb-1">
                              Date: {label}
                            </div>
                            {payload.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center space-x-2">
                                <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                                  {typeof entry.value === "number" ? `${entry.value.toLocaleString()} MW` : "N/A"}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="mae" name="MAE (MW)" fill="#0284c7" className="dark:fill-[#59C8E8]" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rmse" name="RMSE (MW)" fill="#d97706" className="dark:fill-[#F5B84B]" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead-Time Accuracy Curve */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-md dark:shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                  Forecast Degradation by Lead-Time Horizon
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Demonstrating error growth as forecast horizon expands from Intraday to Multi-Day.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-slate-200/80 dark:border-border/60">
                Trading Horizons
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="currentColor" className="text-slate-300 dark:text-border" />
                  <XAxis
                    dataKey="bucketName"
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-slate-500 dark:text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="currentColor"
                    className="text-slate-500 dark:text-muted-foreground"
                    unit=" MW"
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 shadow-2xl rounded-2xl p-3.5 text-xs space-y-1.5 min-w-[200px]">
                            <div className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-border/60 pb-1">
                              Horizon: {label}
                            </div>
                            {payload.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center space-x-2">
                                <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                                  {typeof entry.value === "number" ? `${entry.value.toLocaleString()} MW` : "N/A"}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="mae" name="MAE (MW)" fill="#16a477" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rmse" name="RMSE (MW)" fill="#8b5cf6" className="dark:fill-[#9B51E0]" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Data Table */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-md dark:shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                Daily Forecast Performance Audit Table
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Comprehensive breakdown of error metrics, signed bias, and sample coverage by day.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDailyCSV}
              className="h-8 gap-1.5 text-xs cursor-pointer shadow-2xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200/80 dark:border-border/60 hover:bg-slate-100 dark:hover:bg-[#0B1220]"
              title="Download daily performance audit table as CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export Table CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[340px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#0B1220]/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-200/80 dark:border-border/60">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">MAE (MW)</th>
                  <th className="px-4 py-2.5">RMSE (MW)</th>
                  <th className="px-4 py-2.5">Mean Bias (MW)</th>
                  <th className="px-4 py-2.5">Bias Direction</th>
                  <th className="px-4 py-2.5">Matched Pairs</th>
                  <th className="px-4 py-2.5 text-right">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/60 font-mono text-[11px]">
                {dailyData.map((d) => (
                  <tr key={d.date} className="hover:bg-slate-50/80 dark:hover:bg-[#0B1220]/60 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white tabular-nums">{d.date}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white tabular-nums">
                      {d.mae !== null ? `${d.mae.toLocaleString()} MW` : "N/A"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 tabular-nums">
                      {d.rmse !== null ? `${d.rmse.toLocaleString()} MW` : "N/A"}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-semibold tabular-nums ${
                        (d.meanBias ?? 0) > 0 ? "text-amber-600 dark:text-[#F5B84B]" : "text-cyan-700 dark:text-[#59C8E8]"
                      }`}
                    >
                      {d.meanBias !== null
                        ? `${d.meanBias > 0 ? "+" : ""}${d.meanBias.toLocaleString()} MW`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      {d.meanBias !== null ? (
                        <Badge
                          variant={d.meanBias > 0 ? "warning" : "secondary"}
                          className="text-[9px] py-0 px-1 font-sans"
                        >
                          {d.meanBias > 0 ? "Overforecast" : "Underforecast"}
                        </Badge>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 tabular-nums">
                      {d.matchedCount} / {d.expectedCount}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900 dark:text-white tabular-nums">
                      {d.coveragePercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
