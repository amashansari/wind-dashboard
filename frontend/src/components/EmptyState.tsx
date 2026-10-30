import { CalendarX2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[#E5EAF0] bg-white p-12 text-center space-y-4 shadow-xs">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-xl bg-[#F5F7FA] border border-[#E5EAF0] flex items-center justify-center text-[#667085]">
          <CalendarX2 className="h-6 w-6" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-[#172033] tracking-tight">
          No Wind Observations in Scope
        </h3>
        <p className="text-xs text-[#667085] max-w-md mx-auto leading-relaxed">
          The selected delivery dates or decision cutoff returned zero matched intervals.
          Please select dates within January 2026.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-2 text-xs font-medium cursor-pointer text-[#172033] border-[#E5EAF0] hover:bg-[#F5F7FA]"
      >
        <RotateCcw className="h-3.5 w-3.5 text-[#667085]" />
        <span>Reset to Jan 1–7, 2026</span>
      </Button>
    </div>
  );
}
