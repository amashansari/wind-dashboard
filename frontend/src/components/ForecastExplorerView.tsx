import { useMemo } from "react";
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
import { Info } from "lucide-react";
import type { DeliveryInterval, ForecastsResponse, VintagesResponse } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
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
  const intervals = forecastData?.intervals || [];

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

  return (
    <div className="space-y-6">
      {/* Top Explanation */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start space-x-3 text-xs">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Forecast Vintage Traceability &amp; Guard Against Look-Ahead Bias
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Select any settlement delivery interval below to inspect all forecast publication vintages issued by National Grid ESO.
            Vintages published <strong>before or at the decision cutoff</strong> are eligible for day-ahead commitment.
            Vintages published <strong>after the cutoff</strong> are labeled as post-cutoff revisions for informational auditing only.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Settlement Interval Selector Table */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Settlement Delivery Intervals</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {intervals.length} intervals
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Click any row to inspect historical forecast vintages.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[520px] overflow-y-auto divide-y divide-border">
                {intervals.map((item) => {
                  const isSelected =
                    selectedInterval?.deliveryStartTime === item.deliveryStartTime;
                  return (
                    <button
                      key={item.deliveryStartTime}
                      type="button"
                      onClick={() => onSelectInterval(item)}
                      className={`w-full text-left p-3 transition-colors flex items-center justify-between text-xs ${
                        isSelected
                          ? "bg-primary/10 border-l-4 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">
                          {formatUKDateTime(item.deliveryStartTime)}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Period {item.settlementPeriod ?? "--"} | Actual:{" "}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.actualGenerationMW !== null
                              ? `${item.actualGenerationMW.toLocaleString()} MW`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-mono font-medium text-amber-600 dark:text-amber-400">
                          {item.forecastGenerationMW !== null
                            ? `${item.forecastGenerationMW.toLocaleString()} MW`
                            : "No forecast"}
                        </div>
                        {item.errorMW !== null ? (
                          <div
                            className={`text-[11px] font-mono ${
                              item.errorMW > 0 ? "text-amber-600" : "text-rose-600"
                            }`}
                          >
                            {item.errorMW > 0 ? `+${item.errorMW}` : item.errorMW} MW
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0">
                            Unmatched
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

        {/* Right: Selected Interval Vintage Deep-Dive */}
        <div className="lg:col-span-7 space-y-4">
          {selectedInterval ? (
            <>
              {/* Interval Summary Header Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Interval Detail: {formatUKDateTime(selectedInterval.deliveryStartTime)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Settlement Period {selectedInterval.settlementPeriod ?? "--"} | Decision Cutoff Applied:{" "}
                        <span className="font-mono">
                          {selectedVintages?.cutoffApplied
                            ? formatUKDateTime(selectedVintages.cutoffApplied)
                            : "Day-Ahead 12:00"}
                        </span>
                      </CardDescription>
                    </div>
                    {selectedInterval.isMatched ? (
                      <Badge variant="success">Fully Matched Pair</Badge>
                    ) : (
                      <Badge variant="secondary">Missing Pair Component</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-muted/40 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[11px]">Actual Outturn</span>
                    <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {selectedInterval.actualGenerationMW !== null
                        ? `${selectedInterval.actualGenerationMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[11px]">Cutoff Forecast</span>
                    <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                      {selectedInterval.forecastGenerationMW !== null
                        ? `${selectedInterval.forecastGenerationMW.toLocaleString()} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[11px]">Signed Error</span>
                    <span
                      className={`text-base font-bold font-mono ${
                        (selectedInterval.errorMW ?? 0) > 0 ? "text-amber-600" : "text-rose-600"
                      }`}
                    >
                      {selectedInterval.errorMW !== null
                        ? `${selectedInterval.errorMW > 0 ? "+" : ""}${selectedInterval.errorMW} MW`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-lg">
                    <span className="text-muted-foreground block text-[11px]">Forecast Lead Time</span>
                    <span className="text-base font-bold font-mono text-foreground">
                      {selectedInterval.leadTimeHours !== null
                        ? `${selectedInterval.leadTimeHours} hrs`
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Vintage Evolution Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Forecast Evolution Across Publication Vintages</span>
                    {isLoadingVintages && (
                      <span className="text-xs font-normal text-primary">Loading vintages...</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full">
                    {vintageChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vintageChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis
                            dataKey="shortPublish"
                            tick={{ fontSize: 10 }}
                            stroke="#888888"
                            label={{ value: "Forecast Publication Time", position: "insideBottom", offset: -10, fontSize: 10 }}
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
                                  <div className="bg-card border border-border p-2.5 rounded shadow text-xs space-y-1">
                                    <div className="font-semibold">{d.publishTime}</div>
                                    <div>Lead Time: {d.leadHours}h prior</div>
                                    <div className="text-amber-600 font-mono">
                                      Forecast: {d.forecast.toLocaleString()} MW
                                    </div>
                                    <div className="text-emerald-600 font-mono">
                                      Actual Outturn: {d.actual ? `${d.actual.toLocaleString()} MW` : "N/A"}
                                    </div>
                                    <div className="text-[10px]">
                                      {d.isEligible ? (
                                        <span className="text-emerald-600 font-medium">Eligible at Cutoff</span>
                                      ) : (
                                        <span className="text-rose-500 font-medium">Post-Cutoff Vintage</span>
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
                              stroke="#10b981"
                              strokeWidth={2}
                              strokeDasharray="3 3"
                              label={{ value: "Actual Outturn", fill: "#10b981", fontSize: 10 }}
                            />
                          )}
                          <Line
                            type="stepAfter"
                            dataKey="forecast"
                            name="Forecast Vintage"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        {isLoadingVintages ? "Loading vintage progression..." : "No historical vintages found for this interval."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vintage Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    All Forecast Publication Vintages
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[220px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] sticky top-0 border-b border-border">
                        <tr>
                          <th className="px-3 py-2">Publication Timestamp</th>
                          <th className="px-3 py-2">Lead Time</th>
                          <th className="px-3 py-2">Forecast Value</th>
                          <th className="px-3 py-2 text-right">Cutoff Eligibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono text-[11px]">
                        {selectedVintages?.vintages.map((v) => {
                          const isSelectedVintage =
                            selectedVintages.selectedPublishTime === v.publishTime;
                          return (
                            <tr
                              key={v.publishTime}
                              className={
                                isSelectedVintage
                                  ? "bg-amber-500/10 font-semibold"
                                  : "hover:bg-muted/30"
                              }
                            >
                              <td className="px-3 py-2">
                                {formatUKDateTime(v.publishTime)}
                                {isSelectedVintage && (
                                  <Badge variant="warning" className="ml-2 text-[9px] py-0">
                                    Decision Choice
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-2">{v.leadTimeHours} hrs</td>
                              <td className="px-3 py-2 font-bold text-foreground">
                                {v.forecastGenerationMW.toLocaleString()} MW
                              </td>
                              <td className="px-3 py-2 text-right">
                                {v.isEligibleAtCutoff ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Eligible ({"<="} Cutoff)
                                  </span>
                                ) : (
                                  <span className="text-rose-500 font-medium">
                                    Post-Cutoff (Excluded)
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
            <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
              Select an interval from the list to view its complete forecast vintage history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
