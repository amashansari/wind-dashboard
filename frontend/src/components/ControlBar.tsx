import { Calendar, Clock } from "lucide-react";
import type { ActiveTab, CutoffPreset } from "../types";

interface ControlBarProps {
  startDate: string;
  endDate: string;
  cutoffPreset: CutoffPreset;
  activeTab: ActiveTab;
  onDateChange: (start: string, end: string) => void;
  onCutoffChange: (preset: CutoffPreset) => void;
  onTabChange: (tab: ActiveTab) => void;
}

export function ControlBar({
  startDate,
  endDate,
  cutoffPreset,
  activeTab,
  onDateChange,
  onCutoffChange,
  onTabChange,
}: ControlBarProps) {
  const datePresets = [
    { label: "Jan 1–7", start: "2026-01-01", end: "2026-01-07" },
    { label: "Jan 8–14", start: "2026-01-08", end: "2026-01-14" },
    { label: "Jan 15–21", start: "2026-01-15", end: "2026-01-21" },
    { label: "Jan 22–31", start: "2026-01-22", end: "2026-01-31" },
    { label: "Full Jan 2026", start: "2026-01-01", end: "2026-01-31" },
  ];

  return (
    <div className="bg-card border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "overview"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onTabChange("overview")}
          >
            Overview
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "explorer"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onTabChange("explorer")}
          >
            Forecast Explorer
          </button>
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "accuracy"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onTabChange("accuracy")}
          >
            Accuracy Analysis
          </button>
        </div>

        {/* Date and Cutoff Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Date Presets */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground hidden lg:inline">Range:</span>
            <div className="flex items-center space-x-1">
              {datePresets.map((p) => {
                const isActive = startDate === p.start && endDate === p.end;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onDateChange(p.start, p.end)}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Decision Cutoff Selector */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-border">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground hidden sm:inline">Cutoff:</span>
            <select
              value={cutoffPreset}
              onChange={(e) => onCutoffChange(e.target.value as CutoffPreset)}
              className="bg-background border border-input text-foreground text-xs rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="day_ahead_12">Day-Ahead 12:00 UTC (D-1 Auction Gate)</option>
              <option value="day_ahead_17">Day-Ahead 17:00 UTC (D-1 Evening Hedging)</option>
              <option value="same_day_06">Same-Day 06:00 UTC (Within-Day Morning)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
