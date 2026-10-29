import { CalendarX2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 backdrop-blur-xs p-12 text-center space-y-4 shadow-2xs">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-2xl bg-muted/70 flex items-center justify-center text-muted-foreground shadow-2xs">
          <CalendarX2 className="h-6 w-6" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          No Wind Observations in Scope
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          The selected delivery dates or decision cutoff returned zero matched intervals.
          Please select dates within January 2026.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-2 text-xs shadow-2xs font-medium cursor-pointer"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset to Jan 1–7, 2026</span>
      </Button>
    </div>
  );
}
