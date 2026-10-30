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
      <div className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs">
        <div className="flex items-start space-x-3.5">
          <div className="h-9 w-9 rounded-lg bg-[#E9F7F1] border border-emerald-200 flex items-center justify-center text-[#159B76] shrink-0 mt-0.5">
            <Info className="h-4 w-4" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-[#172033] text-sm tracking-tight">
                Forecast Vintage Traceability &amp; Gate-Closure Guard
              </h4>
              <Badge variant="lime" className="text-[10px] font-mono py-0 font-semibold">
                Audit Trail
              </Badge>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              National Grid ESO issues continuous rolling wind generation forecasts throughout the days leading up to delivery.
              To avoid <strong className="text-[#172033]">look-ahead bias</strong>, wholesale electricity procurement decisions must use only forecasts published{" "}
              <strong className="text-[#172033]">prior to or at auction gate-closure</strong> (e.g. Day-Ahead 12:00 UTC).
              Select any interval below to audit how ESO forecasts evolved and verify that post-cutoff revisions are cleanly quarantined.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settlement Interval Selector Table - Sticky and height-aligned */}
        <div className="lg:col-span-5 min-w-0 lg:sticky lg:top-18 space-y-3">
          <Card className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs flex flex-col lg:max-h-[calc(100vh-90px)]">
            <CardHeader className="pb-3 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#172033]">
                    Settlement Delivery Intervals
                  </CardTitle>
                  <CardDescription className="text-xs text-[#667085]">
                    Hourly intervals in current scope
                  </CardDescription>
                </div>
                <Badge variant="cyan" className="font-mono text-[10px] tabular-nums">
                  {filteredIntervals.length} / {intervals.length}
                </Badge>
              </div>

              {/* Search filter input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#667085]" />
                <input
                  type="text"
                  placeholder="Filter by date or period (e.g. 'Jan 03' or '24')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#F5F7FA] border border-[#E5EAF0] rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-[#172033] placeholder:text-[#667085] focus:outline-none focus:ring-1 focus:ring-[#159B76]/50 font-medium transition-all"
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0 flex-1 overflow-hidden min-h-0">
              <div className="max-h-[580px] lg:max-h-[calc(100vh-210px)] overflow-y-auto space-y-1 p-1">
                {filteredIntervals.map((item) => {
                  const isSelected =
                    selectedInterval?.deliveryStartTime === item.deliveryStartTime;
                  return (
                    <button
                      key={item.deliveryStartTime}
                      type="button"
                      onClick={() => onSelectInterval(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between text-xs cursor-pointer border ${
                        isSelected
                          ? "bg-[#E9F7F1] border-emerald-300 text-[#172033] font-medium shadow-2xs"
                          : "border-transparent hover:bg-[#F5F7FA] hover:border-[#E5EAF0]"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-[#172033] flex items-center space-x-1.5">
                          <span>{formatUKDateTime(item.deliveryStartTime)}</span>
                          {item.settlementPeriod && (
                            <span className="text-[10px] text-[#667085] font-mono font-normal">
                              (SP {item.settlementPeriod})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#667085] font-mono tabular-nums">
                          Outturn:{" "}
                          <span className="font-semibold text-[#159B76]">
                            {item.actualGenerationMW !== null
                              ? `${item.actualGenerationMW.toLocaleString()} MW`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-mono font-semibold text-[#3989D6] tabular-nums">
                          {item.forecastGenerationMW !== null
                            ? `${item.forecastGenerationMW.toLocaleString()} MW`
                            : "No forecast"}
                        </div>
                        {item.errorMW !== null ? (
                          <div
                            className={`text-[11px] font-mono font-medium tabular-nums ${
                              item.errorMW > 0 ? "text-[#E8A23A]" : "text-[#DC6262]"
                            }`}
                          >
                            {item.errorMW > 0 ? `+${item.errorMW.toLocaleString()}` : item.errorMW.toLocaleString()} MW
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 text-[#667085] border-[#E5EAF0]">
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
        <div className="lg:col-span-7 min-w-0 space-y-4">
          {selectedInterval ? (
            <>
              {/* Selected Interval Overview Card */}
              <Card className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-base font-bold text-[#172033]">
                          {formatUKDateTime(selectedInterval.deliveryStartTime)}
                        </CardTitle>
                        <Badge variant="outline" className="font-mono text-xs border-[#E5EAF0] text-[#667085]">
                          Settlement Period {selectedInterval.settlementPeriod ?? "--"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5 text-[#667085]">
                        Cutoff Applied:{" "}
                        <span className="font-mono text-[#172033] font-medium">
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
                        className="h-8 text-xs gap-1.5 cursor-pointer font-medium border-[#E5EAF0] text-[#172033] hover:bg-[#F5F7FA]"
                        title="Download vintage progression as CSV"
                      >
                        <Download className="h-3.5 w-3.5 text-[#667085]" />
                        <span>Export Vintages</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-0">
                  <div className="bg-[#F5F7FA] p-3 rounded-lg border border-[#E5EAF0]">
                    <span className="text-[#667085] block text-[11px]">Realized Outturn</span>
                    <span className="text-lg font-bold font-mono text-[#159B76] tabular-nums">
                      {selectedInterval.actualGenerationMW !== null
                        ? `${selectedInterval.actualGenerationMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-[#F5F7FA] p-3 rounded-lg border border-[#E5EAF0]">
                    <span className="text-[#667085] block text-[11px]">Cutoff Forecast</span>
                    <span className="text-lg font-bold font-mono text-[#3989D6] tabular-nums">
                      {selectedInterval.forecastGenerationMW !== null
                        ? `${selectedInterval.forecastGenerationMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-[#F5F7FA] p-3 rounded-lg border border-[#E5EAF0]">
                    <span className="text-[#667085] block text-[11px]">Signed Error (F − A)</span>
                    <span
                      className={`text-lg font-bold font-mono tabular-nums ${
                        (selectedInterval.errorMW ?? 0) > 0 ? "text-[#E8A23A]" : "text-[#DC6262]"
                      }`}
                    >
                      {selectedInterval.errorMW !== null
                        ? `${selectedInterval.errorMW > 0 ? "+" : ""}${selectedInterval.errorMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-[#F5F7FA] p-3 rounded-lg border border-[#E5EAF0]">
                    <span className="text-[#667085] block text-[11px]">Forecast Horizon</span>
                    <span className="text-lg font-bold font-mono text-[#172033] tabular-nums">
                      {selectedInterval.leadTimeHours !== null
                        ? `${selectedInterval.leadTimeHours} hrs`
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Vintage Evolution Chart */}
              <Card className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs min-w-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-[#172033]">
                        Forecast Evolution Across Publication Vintages
                      </CardTitle>
                      <CardDescription className="text-xs text-[#667085]">
                        Tracking how National Grid adjusted the generation forecast as delivery approached.
                      </CardDescription>
                    </div>
                    {isLoadingVintages && (
                      <span className="text-xs text-[#3989D6] font-medium animate-pulse">
                        Fetching vintages...
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 min-w-0">
                  <div className="h-[250px] w-full min-w-0 pt-2">
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
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF0" />
                          <XAxis
                            dataKey="shortPublish"
                            tick={{ fontSize: 10, fill: "#667085" }}
                            stroke="#667085"
                            label={{
                              value: "Publication Time (UTC)",
                              position: "insideBottom",
                              offset: -10,
                              fontSize: 10,
                              fill: "#667085",
                            }}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#667085" }}
                            stroke="#667085"
                            unit=" MW"
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-white border border-[#E5EAF0] p-3.5 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[220px]">
                                    <div className="font-bold text-[#172033] border-b border-[#E5EAF0] pb-1.5">
                                      Published: {d.publishTime}
                                    </div>
                                    <div className="text-[#667085]">
                                      Horizon:{" "}
                                      <span className="font-mono font-medium text-[#172033] tabular-nums">
                                        {d.leadHours} hours prior
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[#3989D6] font-medium">
                                      <span>Forecast:</span>
                                      <span className="font-mono font-bold tabular-nums">
                                        {d.forecast.toLocaleString()} MW
                                      </span>
                                    </div>
                                    {d.actual && (
                                      <div className="flex justify-between items-center text-[#159B76] font-medium">
                                        <span>Actual Outturn:</span>
                                        <span className="font-mono font-bold tabular-nums">
                                          {d.actual.toLocaleString()} MW
                                        </span>
                                      </div>
                                    )}
                                    <div className="pt-1.5 border-t border-[#E5EAF0]">
                                      {d.isEligible ? (
                                        <Badge variant="outline" className="text-[#159B76] border-emerald-300 bg-[#E9F7F1] text-[10px]">
                                          Eligible at Gate Closure
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-[#DC6262] border-rose-200 bg-rose-50 text-[10px]">
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
                              stroke="#159B76"
                              strokeWidth={2}
                              strokeDasharray="4 2"
                              label={{
                                value: "Realized Outturn",
                                fill: "#159B76",
                                fontSize: 10,
                                position: "top",
                              }}
                            />
                          )}
                          <Line
                            type="stepAfter"
                            dataKey="forecast"
                            name="Forecast"
                            stroke="#3989D6"
                            strokeWidth={2}
                            dot={{ r: 4, strokeWidth: 1, fill: "#3989D6" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-[#667085]">
                        {isLoadingVintages
                          ? "Loading vintage history..."
                          : "No forecast publication vintages found for this interval."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* All Publication Vintages Table */}
              <Card className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold text-[#172033]">
                        Publication Vintage Audit Log
                      </CardTitle>
                      <CardDescription className="text-xs text-[#667085]">
                        Every forecast update logged by National Grid ESO targeting this delivery window.
                      </CardDescription>
                    </div>
                    <Badge variant="cyan" className="font-mono text-[10px] tabular-nums">
                      {selectedVintages?.vintages.length ?? 0} Vintages
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full max-w-full overflow-x-auto">
                    <div className="max-h-[260px] overflow-y-auto">
                      <table className="w-full text-xs text-left min-w-[540px]">
                        <thead className="bg-[#F5F7FA] text-[#667085] uppercase text-[10px] sticky top-0 border-b border-[#E5EAF0] font-semibold">
                          <tr>
                            <th className="px-3.5 py-2.5">Publication Timestamp</th>
                            <th className="px-3.5 py-2.5">Lead Time</th>
                            <th className="px-3.5 py-2.5">Forecast Value</th>
                            <th className="px-3.5 py-2.5">Variance to Actual</th>
                            <th className="px-3.5 py-2.5 text-right">Cutoff Eligibility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5EAF0] font-mono text-[11px]">
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
                                    ? "bg-[#E9F7F1] font-semibold text-[#172033] border-l-2 border-[#159B76]"
                                    : "hover:bg-[#F5F7FA]/80 text-[#172033]"
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
                                <td className="px-3.5 py-2 text-[#667085]">{v.leadTimeHours} hrs</td>
                                <td className="px-3.5 py-2 font-bold text-[#172033]">
                                  {v.forecastGenerationMW.toLocaleString()} MW
                                </td>
                                <td className="px-3.5 py-2">
                                  {variance !== null ? (
                                    <span
                                      className={
                                        variance > 0
                                          ? "text-[#E8A23A] font-semibold"
                                          : "text-[#DC6262] font-semibold"
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
                                    <span className="text-[#159B76] font-medium">
                                      Eligible (&le; Cutoff)
                                    </span>
                                  ) : (
                                    <span className="text-[#DC6262] font-medium">
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
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#E5EAF0] bg-white rounded-xl text-xs text-[#667085] space-y-2 p-6 text-center">
              <Layers className="h-8 w-8 text-[#667085]" />
              <p className="font-medium text-[#172033]">No Delivery Interval Selected</p>
              <p className="text-[#667085] text-[11px] max-w-sm">
                Select any half-hour or hourly settlement interval from the table on the left to audit its forecast publication vintages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
