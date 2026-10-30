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
      <div className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs">
        <div className="flex items-start space-x-3.5">
          <div className="h-9 w-9 rounded-lg bg-[#E9F7F1] border border-emerald-200 flex items-center justify-center text-[#159B76] shrink-0 mt-0.5">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-[#172033] text-sm tracking-tight">
                Methodological Standards &amp; Market Boundary Disclosures
              </h4>
              <Badge variant="lime" className="text-[10px] font-mono py-0 font-semibold">
                Governance
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-[#667085] leading-relaxed text-xs">
              <div>
                <p>
                  <strong className="text-[#172033] font-semibold">Error Convention:</strong> All error deltas follow{" "}
                  <code className="text-[#159B76] font-mono font-semibold bg-[#F5F7FA] border border-[#E5EAF0] px-1.5 py-0.5 rounded-md">
                    error = forecast − actual
                  </code>
                  . Positive bias denotes systematic overforecasting (procurement risk: volume shortage requiring within-day spot balance).
                  Negative bias denotes underforecasting (volume surplus).
                </p>
              </div>
              <div>
                <p>
                  <strong className="text-[#172033] font-semibold">Exclusion of MAPE:</strong> Mean Absolute Percentage Error (MAPE)
                  is purposefully omitted from headline metrics because dividing by realized wind output when generation
                  approaches zero creates mathematical singularities and misleading percentage spikes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards - Aligned with equal heights */}
      {dailyStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
          <Card className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs hover:border-[#159B76]/40 transition-colors h-full min-h-[136px] flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-[#667085] tracking-wider">
                Best Forecast Day
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-[#E9F7F1] border border-emerald-200 flex items-center justify-center text-[#159B76] shrink-0">
                <Award className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg font-bold font-mono text-[#172033] tabular-nums">
                {dailyStats.bestDay?.date ?? "--"}
              </div>
              <p className="text-xs text-[#667085] mt-1">
                Lowest MAE:{" "}
                <span className="font-semibold text-[#159B76] font-mono tabular-nums">
                  {dailyStats.bestDay?.mae?.toLocaleString()} MW
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs hover:border-[#DC6262]/40 transition-colors h-full min-h-[136px] flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-[#667085] tracking-wider">
                Highest Volatility Day
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#DC6262] shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg font-bold font-mono text-[#172033] tabular-nums">
                {dailyStats.worstDay?.date ?? "--"}
              </div>
              <p className="text-xs text-[#667085] mt-1">
                Peak MAE:{" "}
                <span className="font-semibold text-[#DC6262] font-mono tabular-nums">
                  {dailyStats.worstDay?.mae?.toLocaleString()} MW
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs hover:border-[#E8A23A]/40 transition-colors h-full min-h-[136px] flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-semibold text-[#667085] tracking-wider">
                Lead-Time Degradation
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#E8A23A] shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-lg font-bold font-mono text-[#172033] tabular-nums">
                {dailyStats.degradationMultiplier ? `${dailyStats.degradationMultiplier}x Expansion` : "--"}
              </div>
              <p className="text-xs text-[#667085] mt-1" title="Error growth from Intraday (1–4h) to Multi-Day (>24h)">
                Error growth from Intraday (1–4h) to Multi-Day (&gt;24h)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid: Daily Accuracy Performance and Lead Time Decay - Perfectly Aligned */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Daily Accuracy Breakdown Chart */}
        <Card className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs min-w-0 h-full flex flex-col justify-between">
          <CardHeader className="pb-2 min-h-[64px]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[#172033]">
                  Daily Accuracy Trend (MAE &amp; RMSE)
                </CardTitle>
                <CardDescription className="text-xs text-[#667085]">
                  Tracking daily forecast deviation and volatility magnitude across time.
                </CardDescription>
              </div>
              <Badge variant="cyan" className="text-xs font-mono tabular-nums shrink-0">
                {dailyData.length} Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 min-w-0 flex-1 flex flex-col justify-end">
            <div className="h-[300px] w-full min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#667085" }}
                    stroke="#667085"
                    tickFormatter={(d) => d.slice(5)} // MM-DD
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#667085" }}
                    stroke="#667085"
                    unit=" MW"
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-[#E5EAF0] shadow-lg rounded-xl p-3.5 text-xs space-y-1.5 min-w-[200px]">
                            <div className="font-semibold text-[#172033] border-b border-[#E5EAF0] pb-1">
                              Date: {label}
                            </div>
                            {payload.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center space-x-2">
                                <span className="text-[#667085]">{entry.name}:</span>
                                <span className="font-mono font-bold text-[#172033] tabular-nums">
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
                  <Bar dataKey="mae" name="MAE (MW)" fill="#159B76" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rmse" name="RMSE (MW)" fill="#E8A23A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead-Time Accuracy Curve */}
        <Card className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs min-w-0 h-full flex flex-col justify-between">
          <CardHeader className="pb-2 min-h-[64px]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-[#172033]">
                  Forecast Degradation by Lead-Time Horizon
                </CardTitle>
                <CardDescription className="text-xs text-[#667085]">
                  Demonstrating error growth as forecast horizon expands from Intraday to Multi-Day.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-[#E5EAF0] text-[#667085] shrink-0">
                Trading Horizons
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0 min-w-0 flex-1 flex flex-col justify-end">
            <div className="h-[300px] w-full min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                  <XAxis
                    dataKey="bucketName"
                    tick={{ fontSize: 10, fill: "#667085" }}
                    stroke="#667085"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#667085" }}
                    stroke="#667085"
                    unit=" MW"
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-[#E5EAF0] shadow-lg rounded-xl p-3.5 text-xs space-y-1.5 min-w-[200px]">
                            <div className="font-semibold text-[#172033] border-b border-[#E5EAF0] pb-1">
                              Horizon: {label}
                            </div>
                            {payload.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-center space-x-2">
                                <span className="text-[#667085]">{entry.name}:</span>
                                <span className="font-mono font-bold text-[#172033] tabular-nums">
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
                  <Bar dataKey="mae" name="MAE (MW)" fill="#159B76" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rmse" name="RMSE (MW)" fill="#3989D6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Data Table */}
      <Card className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-[#172033]">
                Daily Forecast Performance Audit Table
              </CardTitle>
              <CardDescription className="text-xs text-[#667085]">
                Comprehensive breakdown of error metrics, signed bias, and sample coverage by day.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDailyCSV}
              className="h-8 gap-1.5 text-xs cursor-pointer font-medium text-[#172033] border-[#E5EAF0] hover:bg-[#F5F7FA]"
              title="Download daily performance audit table as CSV"
            >
              <Download className="h-3.5 w-3.5 text-[#667085]" />
              <span>Export Table CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full max-w-full overflow-x-auto">
            <div className="max-h-[340px] overflow-y-auto">
              <table className="w-full text-xs text-left min-w-[620px]">
                <thead className="bg-[#F5F7FA] text-[#667085] uppercase text-[10px] sticky top-0 border-b border-[#E5EAF0] font-semibold">
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
                <tbody className="divide-y divide-[#E5EAF0] font-mono text-[11px]">
                  {dailyData.map((d) => (
                    <tr key={d.date} className="hover:bg-[#F5F7FA]/70 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-[#172033] tabular-nums">{d.date}</td>
                      <td className="px-4 py-2.5 font-bold text-[#172033] tabular-nums">
                        {d.mae !== null ? `${d.mae.toLocaleString()} MW` : "N/A"}
                      </td>
                      <td className="px-4 py-2.5 text-[#667085] tabular-nums">
                        {d.rmse !== null ? `${d.rmse.toLocaleString()} MW` : "N/A"}
                      </td>
                      <td
                        className={`px-4 py-2.5 font-semibold tabular-nums ${
                          (d.meanBias ?? 0) > 0 ? "text-[#E8A23A]" : "text-[#3989D6]"
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
                      <td className="px-4 py-2.5 text-[#667085] tabular-nums">
                        {d.matchedCount} / {d.expectedCount}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-[#172033] tabular-nums">
                        {d.coveragePercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
