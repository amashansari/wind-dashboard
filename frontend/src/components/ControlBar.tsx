import { useState } from "react";
import {
  Calendar,
  Clock,
  LayoutDashboard,
  Compass,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import type { ActiveTab, CutoffPreset } from "../types";
import { Badge } from "./ui/badge";

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
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const presets = [
    { label: "Jan 1–7", start: "2026-01-01", end: "2026-01-07" },
    { label: "Jan 8–14", start: "2026-01-08", end: "2026-01-14" },
    { label: "Jan 15–21", start: "2026-01-15", end: "2026-01-21" },
    { label: "Jan 22–31", start: "2026-01-22", end: "2026-01-31" },
    { label: "Full Month", start: "2026-01-01", end: "2026-01-31" },
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd && customStart <= customEnd) {
      onDateChange(customStart, customEnd);
      setShowCustomDates(false);
    }
  };

  const tabs: Array<{ id: ActiveTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "explorer", label: "Forecast Explorer", icon: Compass },
    { id: "accuracy", label: "Accuracy Analysis", icon: BarChart3 },
  ];

  return (
    <div className="bg-card/90 backdrop-blur-md border-b border-border/70 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Navigation Tabs */}
        <div className="inline-flex rounded-xl bg-muted/70 p-1 border border-border/50 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40 font-medium"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Delivery Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center space-x-1 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="hidden xl:inline">Delivery:</span>
            </div>

            <div className="inline-flex rounded-xl bg-muted/70 p-0.5 border border-border/50">
              {presets.map((p) => {
                const isActive =
                  startDate === p.start && endDate === p.end && !showCustomDates;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setShowCustomDates(false);
                      onDateChange(p.start, p.end);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowCustomDates(!showCustomDates)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer active:scale-[0.98] ${
                  showCustomDates
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Date Form Dropdown */}
            {showCustomDates && (
              <form
                onSubmit={handleApplyCustom}
                className="flex items-center space-x-1.5 bg-card/95 backdrop-blur-md p-1.5 rounded-xl border border-border/70 shadow-md animate-in fade-in-50"
              >
                <input
                  type="date"
                  min="2026-01-01"
                  max="2026-01-31"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-muted/60 border border-input rounded-lg px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-muted-foreground font-mono">→</span>
                <input
                  type="date"
                  min="2026-01-01"
                  max="2026-01-31"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-muted/60 border border-input rounded-lg px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground font-semibold px-2.5 py-1 rounded-lg text-[11px] hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-2xs"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Decision Cutoff Selector */}
          <div className="flex items-center space-x-1.5 pl-2.5 border-l border-border/60">
            <div className="flex items-center space-x-1 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden lg:inline">Cutoff:</span>
            </div>
            <select
              value={cutoffPreset}
              onChange={(e) => onCutoffChange(e.target.value as CutoffPreset)}
              className="bg-card border border-border/70 text-foreground text-xs rounded-xl px-2.5 py-1 font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="day_ahead_12">
                Day-Ahead 12:00 UTC (D-1 Auction Gate)
              </option>
              <option value="day_ahead_17">
                Day-Ahead 17:00 UTC (D-1 Evening Hedging)
              </option>
              <option value="same_day_06">
                Same-Day 06:00 UTC (Within-Day Morning)
              </option>
            </select>
          </div>

          {/* Unit Badge */}
          <div className="hidden sm:flex items-center space-x-1 pl-2.5 border-l border-border/60 text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <Badge
              variant="outline"
              className="font-mono text-[10px] py-0 text-muted-foreground"
            >
              MW
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
