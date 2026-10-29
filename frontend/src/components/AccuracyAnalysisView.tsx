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
import { ShieldCheck } from "lucide-react";
import type { AccuracyResponse, LeadTimesResponse } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";

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

  return (
    <div className="space-y-6">
      {/* Methodology & Limitations Notice Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start space-x-3 text-xs">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">
              Methodological Standards &amp; Market Boundary Disclosures
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Error Convention:</strong> All errors are computed as{" "}
              <code className="text-primary font-mono font-semibold">error = forecast - actual</code>.
              Positive bias reflects systematic overforecasting (procurement risk: surplus power spilled or sold down).
              Negative bias reflects systematic underforecasting (procurement risk: volume deficit requiring emergency within-day purchase).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Why MAPE is Excluded:</strong> Mean Absolute Percentage Error (MAPE) is intentionally excluded from headline KPIs because dividing by actual generation causes mathematical singularities and misleading distortion when wind generation drops near zero during calm spells.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Daily Accuracy Performance and Lead Time Decay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Accuracy Breakdown Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Daily Accuracy Trend (MAE &amp; RMSE)</span>
              <Badge variant="outline" className="text-xs">
                {dailyData.length} days
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Tracking forecast deviation and risk volatility across each day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    stroke="#888888"
                    tickFormatter={(d) => d.slice(5)} // MM-DD
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="#888888" unit=" MW" />
                  <Tooltip
                    formatter={(val: unknown) => [
                      typeof val === "number" ? `${val.toLocaleString()} MW` : "N/A",
                    ]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="mae" name="MAE (MW)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="rmse" name="RMSE (MW)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead-Time Accuracy Curve */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Forecast Degradation by Lead Time</span>
              <Badge variant="outline" className="text-xs">
                Trading Horizons
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Demonstrating error growth as the forecast lead time extends from intraday to multi-day horizons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="bucketName"
                    tick={{ fontSize: 10 }}
                    stroke="#888888"
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="#888888" unit=" MW" />
                  <Tooltip
                    formatter={(val: unknown, name: unknown) => [
                      typeof val === "number" ? `${val.toLocaleString()} MW` : "N/A",
                      String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="mae" name="MAE (MW)" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="rmse" name="RMSE (MW)" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Daily Forecast Performance Audit Table
          </CardTitle>
          <CardDescription className="text-xs">
            Complete daily metrics including sample pair counts and completeness coverage.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] sticky top-0 border-b border-border">
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
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {dailyData.map((d) => (
                  <tr key={d.date} className="hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium text-foreground">{d.date}</td>
                    <td className="px-4 py-2 font-bold text-foreground">
                      {d.mae !== null ? `${d.mae.toLocaleString()} MW` : "N/A"}
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {d.rmse !== null ? `${d.rmse.toLocaleString()} MW` : "N/A"}
                    </td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        (d.meanBias ?? 0) > 0 ? "text-amber-600" : "text-rose-600"
                      }`}
                    >
                      {d.meanBias !== null
                        ? `${d.meanBias > 0 ? "+" : ""}${d.meanBias.toLocaleString()} MW`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      {d.meanBias !== null ? (
                        <Badge
                          variant={d.meanBias > 0 ? "warning" : "secondary"}
                          className="text-[9px] py-0"
                        >
                          {d.meanBias > 0 ? "Overforecast" : "Underforecast"}
                        </Badge>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {d.matchedCount} / {d.expectedCount}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
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
