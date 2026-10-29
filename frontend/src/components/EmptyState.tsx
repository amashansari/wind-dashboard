import { CalendarX2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 dark:border-border/70 bg-white dark:bg-[#14283A]/85 backdrop-blur-xl p-12 text-center space-y-4 shadow-md dark:shadow-xl">
      <div className="flex justify-center">
        <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 dark:bg-[#0B1220]/70 border border-cyan-500/20 dark:border-border/60 flex items-center justify-center text-cyan-600 dark:text-[#59C8E8] shadow-inner">
          <CalendarX2 className="h-7 w-7" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
          No Wind Observations in Scope
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          The selected delivery dates or decision cutoff returned zero matched intervals.
          Please select dates within January 2026.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-2 text-xs shadow-2xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-border/60 hover:bg-slate-100 dark:hover:bg-[#0B1220]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset to Jan 1–7, 2026</span>
      </Button>
    </div>
  );
}
