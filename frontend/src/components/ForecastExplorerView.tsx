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
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start space-x-3 text-xs shadow-2xs">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
          <Info className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-foreground text-sm">
            Forecast Vintage Traceability &amp; Gate-Closure Guard
          </h4>
          <p className="text-muted-foreground leading-relaxed">
            National Grid ESO issues continuous rolling wind generation forecasts throughout the days leading up to delivery.
            To avoid <strong>look-ahead bias</strong>, wholesale electricity procurement decisions must use only forecasts published
            <strong> prior to or at auction gate-closure</strong> (e.g. Day-Ahead 12:00 UTC).
            Select any interval below to audit how ESO forecasts evolved and verify that post-cutoff revisions are cleanly quarantined.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settlement Interval Selector Table */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="shadow-xs">
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Settlement Delivery Intervals
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Hourly intervals in current scope
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {filteredIntervals.length} / {intervals.length}
                </Badge>
              </div>

              {/* Search filter input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by date or period (e.g. 'Jan 03' or '24')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-muted/60 border border-input rounded-md pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[560px] overflow-y-auto divide-y divide-border">
                {filteredIntervals.map((item) => {
                  const isSelected =
                    selectedInterval?.deliveryStartTime === item.deliveryStartTime;
                  return (
                    <button
                      key={item.deliveryStartTime}
                      type="button"
                      onClick={() => onSelectInterval(item)}
                      className={`w-full text-left px-3.5 py-2.5 transition-all flex items-center justify-between text-xs cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-l-4 border-primary font-medium"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground flex items-center space-x-1.5">
                          <span>{formatUKDateTime(item.deliveryStartTime)}</span>
                          {item.settlementPeriod && (
                            <span className="text-[10px] text-muted-foreground font-mono font-normal">
                              (SP {item.settlementPeriod})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Outturn:{" "}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.actualGenerationMW !== null
                              ? `${item.actualGenerationMW.toLocaleString()} MW`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                          {item.forecastGenerationMW !== null
                            ? `${item.forecastGenerationMW.toLocaleString()} MW`
                            : "No forecast"}
                        </div>
                        {item.errorMW !== null ? (
                          <div
                            className={`text-[11px] font-mono font-medium ${
                              item.errorMW > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {item.errorMW > 0 ? `+${item.errorMW.toLocaleString()}` : item.errorMW.toLocaleString()} MW
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 text-muted-foreground">
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
              <Card className="shadow-xs border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-base font-bold text-foreground">
                          {formatUKDateTime(selectedInterval.deliveryStartTime)}
                        </CardTitle>
                        <Badge variant="outline" className="font-mono text-xs">
                          Settlement Period {selectedInterval.settlementPeriod ?? "--"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Cutoff Applied:{" "}
                        <span className="font-mono text-foreground font-medium">
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
                        className="h-7 text-xs gap-1.5 cursor-pointer hover:bg-muted"
                        title="Download vintage progression as CSV"
                      >
                        <Download className="h-3 w-3 text-muted-foreground" />
                        <span>Export Vintages</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[11px]">Realized Outturn</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {selectedInterval.actualGenerationMW !== null
                        ? `${selectedInterval.actualGenerationMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[11px]">Cutoff Forecast</span>
                    <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                      {selectedInterval.forecastGenerationMW !== null
                        ? `${selectedInterval.forecastGenerationMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[11px]">Signed Error (F − A)</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        (selectedInterval.errorMW ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {selectedInterval.errorMW !== null
                        ? `${selectedInterval.errorMW > 0 ? "+" : ""}${selectedInterval.errorMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[11px]">Forecast Horizon</span>
                    <span className="text-lg font-bold font-mono text-foreground">
                      {selectedInterval.leadTimeHours !== null
                        ? `${selectedInterval.leadTimeHours} hrs`
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Vintage Evolution Chart */}
              <Card className="shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Forecast Evolution Across Publication Vintages
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Tracking how National Grid adjusted the generation forecast as delivery approached.
                      </CardDescription>
                    </div>
                    {isLoadingVintages && (
                      <span className="text-xs text-primary font-medium animate-pulse">
                        Fetching vintages...
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-2">
                    {vintageChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={vintageChartData}
                          margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                          <XAxis
                            dataKey="shortPublish"
                            tick={{ fontSize: 10 }}
                            stroke="#888888"
                            label={{
                              value: "Publication Time (UTC)",
                              position: "insideBottom",
                              offset: -10,
                              fontSize: 10,
                              fill: "#888888",
                            }}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            stroke="#888888"
                            unit=" MW"
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[210px]">
                                    <div className="font-bold text-foreground border-b border-border pb-1">
                                      Published: {d.publishTime}
                                    </div>
                                    <div className="text-muted-foreground">
                                      Horizon:{" "}
                                      <span className="font-mono font-medium text-foreground">
                                        {d.leadHours} hours prior
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 font-medium">
                                      <span>Forecast:</span>
                                      <span className="font-mono font-bold">
                                        {d.forecast.toLocaleString()} MW
                                      </span>
                                    </div>
                                    {d.actual && (
                                      <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                        <span>Actual Outturn:</span>
                                        <span className="font-mono font-bold">
                                          {d.actual.toLocaleString()} MW
                                        </span>
                                      </div>
                                    )}
                                    <div className="pt-1 border-t border-border/50">
                                      {d.isEligible ? (
                                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]">
                                          Eligible at Gate Closure
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-rose-500 border-rose-500/30 bg-rose-500/10 text-[10px]">
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
                              stroke="#059669"
                              strokeWidth={2}
                              strokeDasharray="4 2"
                              label={{
                                value: "Realized Outturn",
                                fill: "#059669",
                                fontSize: 10,
                                position: "top",
                              }}
                            />
                          )}
                          <Line
                            type="stepAfter"
                            dataKey="forecast"
                            name="Forecast"
                            stroke="#d97706"
                            strokeWidth={2}
                            dot={{ r: 4, strokeWidth: 1, fill: "#d97706" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        {isLoadingVintages
                          ? "Loading vintage history..."
                          : "No forecast publication vintages found for this interval."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* All Publication Vintages Table */}
              <Card className="shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Publication Vintage Audit Log
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Every forecast update logged by National Grid ESO targeting this delivery window.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {selectedVintages?.vintages.length ?? 0} Vintages
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[260px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] sticky top-0 border-b border-border">
                        <tr>
                          <th className="px-3.5 py-2">Publication Timestamp</th>
                          <th className="px-3.5 py-2">Lead Time</th>
                          <th className="px-3.5 py-2">Forecast Value</th>
                          <th className="px-3.5 py-2">Variance to Actual</th>
                          <th className="px-3.5 py-2 text-right">Cutoff Eligibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono text-[11px]">
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
                                  ? "bg-amber-500/10 font-semibold"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <td className="px-3.5 py-2">
                                <div className="flex items-center space-x-1.5">
                                  <span>{formatUKDateTime(v.publishTime)}</span>
                                  {isSelectedVintage && (
                                    <Badge
                                      variant="warning"
                                      className="text-[9px] py-0 px-1 font-sans"
                                    >
                                      Selected Cutoff
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-3.5 py-2">{v.leadTimeHours} hrs</td>
                              <td className="px-3.5 py-2 font-bold text-foreground">
                                {v.forecastGenerationMW.toLocaleString()} MW
                              </td>
                              <td className="px-3.5 py-2">
                                {variance !== null ? (
                                  <span
                                    className={
                                      variance > 0
                                        ? "text-amber-600 dark:text-amber-400 font-semibold"
                                        : "text-rose-600 dark:text-rose-400 font-semibold"
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
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Eligible (&le; Cutoff)
                                  </span>
                                ) : (
                                  <span className="text-rose-500 font-medium">
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
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground space-y-2 p-6 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/60" />
              <p className="font-medium text-foreground">No Delivery Interval Selected</p>
              <p className="text-muted-foreground text-[11px] max-w-sm">
                Select any half-hour or hourly settlement interval from the table on the left to audit its forecast publication vintages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
