import { Card, CardContent } from "./ui/card";

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-12 bg-muted/60 rounded-lg" />

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <div className="h-3 w-24 bg-muted/70 rounded" />
              <div className="h-8 w-32 bg-muted/80 rounded" />
              <div className="h-3 w-40 bg-muted/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="h-5 w-64 bg-muted/70 rounded" />
          <div className="h-4 w-96 bg-muted/50 rounded" />
          <div className="h-72 w-full bg-muted/40 rounded-lg mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}
