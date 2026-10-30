import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading analytics dashboard">
      {/* Executive Briefing Banner Skeleton */}
      <div className="rounded-xl border border-[#E5EAF0] bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full bg-[#159B76]/40" />
              <Skeleton className="h-4 w-64 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-full max-w-3xl rounded" />
            <Skeleton className="h-3.5 w-3/4 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg shrink-0" />
        </div>
      </div>

      {/* Scope and Context Status Bar Skeleton */}
      <div className="bg-white border border-[#E5EAF0] rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-lg" />
        </div>
      </div>

      {/* 4 Headline KPI Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs p-5">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-2 space-y-0">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 70/30 Grid: Time Series Chart Skeleton + Dispatch Profile Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Time Series Chart Skeleton (8 cols) */}
        <Card className="lg:col-span-8 rounded-xl border border-[#E5EAF0] bg-white shadow-xs min-w-0">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-72 rounded-md" />
                <Skeleton className="h-3.5 w-96 max-w-full rounded" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-52 rounded-lg" />
                <Skeleton className="h-5 w-32 rounded-md hidden md:block" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 min-w-0">
            <div className="h-[380px] w-full min-w-0 pt-4 relative flex flex-col justify-between">
              {/* Simulated Coordinate Grid Lines */}
              <div className="space-y-12 w-full">
                {[1, 2, 3, 4, 5].map((g) => (
                  <div key={g} className="border-b border-[#E5EAF0] w-full h-0" />
                ))}
              </div>

              {/* Simulated Wave Silhouette */}
              <div className="absolute inset-x-6 bottom-8 h-48 rounded-lg overflow-hidden bg-gradient-to-t from-slate-100 to-transparent flex items-end">
                <Skeleton className="w-full h-full rounded-lg opacity-60" />
              </div>

              {/* X-Axis Tick Placeholders */}
              <div className="flex justify-between items-center px-4 pt-2">
                {[1, 2, 3, 4, 5, 6, 7].map((t) => (
                  <Skeleton key={t} className="h-3 w-12 rounded" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Profile Skeleton (4 cols) */}
        <Card className="lg:col-span-4 rounded-xl border border-[#E5EAF0] bg-white shadow-xs min-w-0">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-3 w-64 rounded" />
          </CardHeader>
          <CardContent className="space-y-3.5 pt-0">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <div className="pt-2 border-t border-[#E5EAF0] space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Residuals Chart Skeleton */}
      <Card className="rounded-xl border border-[#E5EAF0] bg-white shadow-xs min-w-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-60 rounded-md" />
              <Skeleton className="h-3 w-80 max-w-full rounded" />
            </div>
            <Skeleton className="h-5 w-44 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 min-w-0">
          <div className="h-[180px] w-full min-w-0 pt-2 flex items-end gap-2 px-2">
            {[40, 65, 30, 80, 50, 90, 45, 70, 35, 85, 60, 40, 75, 55, 95, 65, 45, 80, 35, 60, 50, 70, 40, 85].map((h, idx) => (
              <Skeleton
                key={idx}
                className="flex-1 rounded-t-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
