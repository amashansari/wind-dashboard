import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Info,
  Search,
  Download,
  Layers,
} from "lucide-react";
import type { DeliveryInterval, ForecastsResponse, VintagesResponse } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { formatUKDateTime, formatUKTime } from "../lib/utils";

interface ForecastExplorerViewProps {
  forecastData: ForecastsResponse | null;
  selectedInterval: DeliveryInterval | null;
  selectedVintages: VintagesResponse | null;
  isLoadingVintages: boolean;
  onSelectInterval: (interval: DeliveryInterval) => void;
}

export function ForecastExplorerView({
  forecastData,
  selectedInterval,
  selectedVintages,
  isLoadingVintages,
  onSelectInterval,
}: ForecastExplorerViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const intervals = forecastData?.intervals || [];

  const filteredIntervals = useMemo(() => {
    if (!searchTerm.trim()) return intervals;
    const term = searchTerm.toLowerCase();
    return intervals.filter((item) => {
      const dt = item.deliveryStartTime.toLowerCase();
      const period = item.settlementPeriod ? String(item.settlementPeriod) : "";
      return dt.includes(term) || period.includes(term);
    });
  }, [intervals, searchTerm]);

  const vintageChartData = useMemo(() => {
    if (!selectedVintages || !selectedVintages.vintages) return [];
    return selectedVintages.vintages.map((v) => ({
      publishTime: formatUKDateTime(v.publishTime),
      shortPublish: formatUKTime(v.publishTime),
      leadHours: v.leadTimeHours,
      forecast: v.forecastGenerationMW,
      actual: selectedInterval?.actualGenerationMW,
      isEligible: v.isEligibleAtCutoff,
    }));
  }, [selectedVintages, selectedInterval]);

  // Export Vintages CSV
  const handleExportVintagesCSV = () => {
    if (!selectedVintages || !selectedInterval) return;
    const headers = [
      "Target Delivery Start",
      "Publication Timestamp (UTC)",
      "Lead Time (Hours)",
      "Forecast Generation (MW)",
      "Actual Outturn (MW)",
      "Cutoff Eligibility",
      "Selected as Decision Choice",
    ];
    const rows = selectedVintages.vintages.map((v) => [
      selectedInterval.deliveryStartTime,
      v.publishTime,
      v.leadTimeHours,
      v.forecastGenerationMW,
      selectedInterval.actualGenerationMW ?? "",
      v.isEligibleAtCutoff ? "Eligible" : "Post-Cutoff",
      selectedVintages.selectedPublishTime === v.publishTime ? "YES" : "NO",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `vintages_interval_${selectedInterval.deliveryStartTime.replace(/[:]/g, "-")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Pedagogical & Integrity Callout */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 bg-linear-to-br from-white via-emerald-50/25 to-cyan-50/20 dark:from-[#14283A] dark:via-[#0B1220] dark:to-[#14283A] p-6 text-xs shadow-xs dark:shadow-xl backdrop-blur-xl">
        <div className="flex items-start space-x-3.5 relative z-10">
          <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-[#0284c7] dark:text-[#59C8E8] shrink-0 mt-0.5 shadow-[0_0_15px_rgba(89,200,232,0.2)]">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-slate-900 dark:text-foreground text-sm tracking-tight">
                Forecast Vintage Traceability &amp; Gate-Closure Guard
              </h4>
              <Badge variant="lime" className="text-[10px] font-mono py-0 font-semibold">
                Audit Trail
              </Badge>
            </div>
            <p className="text-slate-600 dark:text-muted-foreground leading-relaxed">
              National Grid ESO issues continuous rolling wind generation forecasts throughout the days leading up to delivery.
              To avoid <strong className="text-slate-900 dark:text-foreground">look-ahead bias</strong>, wholesale electricity procurement decisions must use only forecasts published
              <strong className="text-slate-900 dark:text-foreground"> prior to or at auction gate-closure</strong> (e.g. Day-Ahead 12:00 UTC).
              Select any interval below to audit how ESO forecasts evolved and verify that post-cutoff revisions are cleanly quarantined.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settlement Interval Selector Table */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-xs dark:shadow-xl">
            <CardHeader className="pb-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-foreground">
                    Settlement Delivery Intervals
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-muted-foreground">
                    Hourly intervals in current scope
                  </CardDescription>
                </div>
                <Badge variant="cyan" className="font-mono text-[10px] tabular-nums">
                  {filteredIntervals.length} / {intervals.length}
                </Badge>
              </div>

              {/* Search filter input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by date or period (e.g. 'Jan 03' or '24')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1220]/70 border border-slate-200/80 dark:border-border/60 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium transition-all shadow-inner"
                />
              </div>
            </CardHeader>
            <CardContent className="p-1">
              <div className="max-h-[560px] overflow-y-auto space-y-1 p-1">
                {filteredIntervals.map((item) => {
                  const isSelected =
                    selectedInterval?.deliveryStartTime === item.deliveryStartTime;
                  return (
                    <button
                      key={item.deliveryStartTime}
                      type="button"
                      onClick={() => onSelectInterval(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer active:scale-[0.99] border ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/40 text-slate-900 dark:text-foreground font-medium shadow-xs dark:shadow-inner"
                          : "border-transparent hover:bg-slate-100/70 dark:hover:bg-muted/40 hover:border-slate-200/60 dark:hover:border-border/40"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-foreground flex items-center space-x-1.5">
                          <span>{formatUKDateTime(item.deliveryStartTime)}</span>
                          {item.settlementPeriod && (
                            <span className="text-[10px] text-slate-500 dark:text-muted-foreground font-mono font-normal">
                              (SP {item.settlementPeriod})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-muted-foreground font-mono tabular-nums">
                          Outturn:{" "}
                          <span className="font-semibold text-[#16A477]">
                            {item.actualGenerationMW !== null
                              ? `${item.actualGenerationMW.toLocaleString()} MW`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-mono font-semibold text-[#0284c7] dark:text-[#59C8E8] tabular-nums">
                          {item.forecastGenerationMW !== null
                            ? `${item.forecastGenerationMW.toLocaleString()} MW`
                            : "No forecast"}
                        </div>
                        {item.errorMW !== null ? (
                          <div
                            className={`text-[11px] font-mono font-medium tabular-nums ${
                              item.errorMW > 0 ? "text-[#D97706] dark:text-[#F5B84B]" : "text-[#E11D48] dark:text-[#FF5A76]"
                            }`}
                          >
                            {item.errorMW > 0 ? `+${item.errorMW.toLocaleString()}` : item.errorMW.toLocaleString()} MW
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 text-slate-400 dark:text-muted-foreground border-slate-200/80 dark:border-border/60">
                            Missing
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Selected Interval Deep-Dive */}
        <div className="lg:col-span-7 space-y-4">
          {selectedInterval ? (
            <>
              {/* Selected Interval Overview Card */}
              <Card className="shadow-xs dark:shadow-xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          {formatUKDateTime(selectedInterval.deliveryStartTime)}
                        </CardTitle>
                        <Badge variant="outline" className="font-mono text-xs border-slate-200/80 dark:border-border/60">
                          Settlement Period {selectedInterval.settlementPeriod ?? "--"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                        Cutoff Applied:{" "}
                        <span className="font-mono text-slate-900 dark:text-white font-medium">
                          {selectedVintages?.cutoffApplied
                            ? formatUKDateTime(selectedVintages.cutoffApplied)
                            : "Standard Day-Ahead Gate"}
                        </span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportVintagesCSV}
                        className="h-8 text-xs gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-100 dark:hover:bg-muted font-medium border-slate-200/80 dark:border-border/60 text-slate-800 dark:text-slate-200"
                        title="Download vintage progression as CSV"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <span>Export Vintages</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-[#0B1220]/80 p-3 rounded-xl border border-slate-200/80 dark:border-border/50">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Realized Outturn</span>
                    <span className="text-lg font-bold font-mono text-[#16A477] tabular-nums">
                      {selectedInterval.actualGenerationMW !== null
                        ? `${selectedInterval.actualGenerationMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0B1220]/80 p-3 rounded-xl border border-slate-200/80 dark:border-border/50">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Cutoff Forecast</span>
                    <span className="text-lg font-bold font-mono text-[#0284c7] dark:text-[#59C8E8] tabular-nums">
                      {selectedInterval.forecastGenerationMW !== null
                        ? `${selectedInterval.forecastGenerationMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0B1220]/80 p-3 rounded-xl border border-slate-200/80 dark:border-border/50">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Signed Error (F − A)</span>
                    <span
                      className={`text-lg font-bold font-mono tabular-nums ${
                        (selectedInterval.errorMW ?? 0) > 0 ? "text-[#D97706] dark:text-[#F5B84B]" : "text-[#E11D48] dark:text-[#FF5A76]"
                      }`}
                    >
                      {selectedInterval.errorMW !== null
                        ? `${selectedInterval.errorMW > 0 ? "+" : ""}${selectedInterval.errorMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0B1220]/80 p-3 rounded-xl border border-slate-200/80 dark:border-border/50">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Forecast Horizon</span>
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                      {selectedInterval.leadTimeHours !== null
                        ? `${selectedInterval.leadTimeHours} hrs`
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Vintage Evolution Chart */}
              <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-xs dark:shadow-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                        Forecast Evolution Across Publication Vintages
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Tracking how National Grid adjusted the generation forecast as delivery approached.
                      </CardDescription>
                    </div>
                    {isLoadingVintages && (
                      <span className="text-xs text-[#0284c7] dark:text-[#59C8E8] font-medium animate-pulse">
                        Fetching vintages...
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-2">
                    {isLoadingVintages ? (
                      <div className="space-y-3 h-full flex flex-col justify-center">
                        <Skeleton className="h-4 w-52 rounded" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                      </div>
                    ) : vintageChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={vintageChartData}
                          margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} stroke="currentColor" className="text-slate-300 dark:text-slate-700" />
                          <XAxis
                            dataKey="shortPublish"
                            tick={{ fontSize: 10 }}
                            stroke="currentColor"
                            className="text-slate-500 dark:text-slate-400"
                            label={{
                              value: "Publication Time (UTC)",
                              position: "insideBottom",
                              offset: -10,
                              fontSize: 10,
                              fill: "currentColor",
                              className: "text-slate-500 dark:text-slate-400",
                            }}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            stroke="currentColor"
                            className="text-slate-500 dark:text-slate-400"
                            unit=" MW"
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[220px]">
                                    <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-border/60 pb-1.5">
                                      Published: {d.publishTime}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400">
                                      Horizon:{" "}
                                      <span className="font-mono font-medium text-slate-900 dark:text-white tabular-nums">
                                        {d.leadHours} hours prior
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[#0284c7] dark:text-[#59C8E8] font-medium">
                                      <span>Forecast:</span>
                                      <span className="font-mono font-bold tabular-nums">
                                        {d.forecast.toLocaleString()} MW
                                      </span>
                                    </div>
                                    {d.actual && (
                                      <div className="flex justify-between items-center text-[#16A477] font-medium">
                                        <span>Actual Outturn:</span>
                                        <span className="font-mono font-bold tabular-nums">
                                          {d.actual.toLocaleString()} MW
                                        </span>
                                      </div>
                                    )}
                                    <div className="pt-1.5 border-t border-slate-200/80 dark:border-border/50">
                                      {d.isEligible ? (
                                        <Badge variant="outline" className="text-[#16A477] border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                                          Eligible at Gate Closure
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[#E11D48] dark:text-[#FF5A76] border-rose-500/30 bg-rose-500/10 text-[10px]">
                                          Post-Cutoff Revision
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {selectedInterval.actualGenerationMW !== null && (
                            <ReferenceLine
                              y={selectedInterval.actualGenerationMW}
                              stroke="#16A477"
                              strokeWidth={2}
                              strokeDasharray="4 2"
                              label={{
                                value: "Realized Outturn",
                                fill: "#16A477",
                                fontSize: 10,
                                position: "top",
                              }}
                            />
                          )}
                          <Line
                            type="stepAfter"
                            dataKey="forecast"
                            name="Forecast"
                            stroke="#0284c7"
                            strokeWidth={2}
                            dot={{ r: 4, strokeWidth: 1, fill: "#0284c7" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                        {isLoadingVintages
                          ? "Loading vintage history..."
                          : "No forecast publication vintages found for this interval."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* All Publication Vintages Table */}
              <Card className="rounded-2xl border-slate-200/80 dark:border-border/60 bg-white dark:bg-[#14283A]/85 backdrop-blur-md shadow-xs dark:shadow-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">
                        Publication Vintage Audit Log
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Every forecast update logged by National Grid ESO targeting this delivery window.
                      </CardDescription>
                    </div>
                    <Badge variant="cyan" className="font-mono text-[10px] tabular-nums">
                      {selectedVintages?.vintages.length ?? 0} Vintages
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[260px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-[#0B1220]/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-200/80 dark:border-border/60">
                        <tr>
                          <th className="px-3.5 py-2">Publication Timestamp</th>
                          <th className="px-3.5 py-2">Lead Time</th>
                          <th className="px-3.5 py-2">Forecast Value</th>
                          <th className="px-3.5 py-2">Variance to Actual</th>
                          <th className="px-3.5 py-2 text-right">Cutoff Eligibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-border/60 font-mono text-[11px]">
                        {selectedVintages?.vintages.map((v) => {
                          const isSelectedVintage =
                            selectedVintages.selectedPublishTime === v.publishTime;
                          const variance =
                            selectedInterval.actualGenerationMW !== null
                              ? v.forecastGenerationMW - selectedInterval.actualGenerationMW
                              : null;
                          return (
                            <tr
                              key={v.publishTime}
                              className={`transition-colors ${
                                isSelectedVintage
                                  ? "bg-emerald-50 dark:bg-emerald-500/15 font-semibold text-slate-900 dark:text-white border-l-2 border-emerald-500"
                                  : "hover:bg-slate-50/80 dark:hover:bg-[#0B1220]/60 text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              <td className="px-3.5 py-2">
                                <div className="flex items-center space-x-1.5">
                                  <span>{formatUKDateTime(v.publishTime)}</span>
                                  {isSelectedVintage && (
                                    <Badge
                                      variant="lime"
                                      className="text-[9px] py-0 px-1 font-sans"
                                    >
                                      Selected Cutoff
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-3.5 py-2">{v.leadTimeHours} hrs</td>
                              <td className="px-3.5 py-2 font-bold text-slate-900 dark:text-white">
                                {v.forecastGenerationMW.toLocaleString()} MW
                              </td>
                              <td className="px-3.5 py-2">
                                {variance !== null ? (
                                  <span
                                    className={
                                      variance > 0
                                        ? "text-[#D97706] dark:text-[#F5B84B] font-semibold"
                                        : "text-[#E11D48] dark:text-[#FF5A76] font-semibold"
                                    }
                                  >
                                    {variance > 0 ? `+${variance.toLocaleString()}` : variance.toLocaleString()} MW
                                  </span>
                                ) : (
                                  "--"
                                )}
                              </td>
                              <td className="px-3.5 py-2 text-right">
                                {v.isEligibleAtCutoff ? (
                                  <span className="text-[#16A477] font-medium">
                                    Eligible (&le; Cutoff)
                                  </span>
                                ) : (
                                  <span className="text-[#E11D48] dark:text-[#FF5A76] font-medium">
                                    Post-Cutoff (&gt; Cutoff)
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200/80 dark:border-border/80 bg-slate-50/50 dark:bg-[#14283A]/40 rounded-2xl text-xs text-slate-500 dark:text-slate-400 space-y-2 p-6 text-center">
              <Layers className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              <p className="font-medium text-slate-900 dark:text-white">No Delivery Interval Selected</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-sm">
                Select any half-hour or hourly settlement interval from the table on the left to audit its forecast publication vintages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
