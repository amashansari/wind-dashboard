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
    <div className="bg-white/95 dark:bg-[#14283A]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-border/60 shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] sticky top-16 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Navigation Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100/90 dark:bg-[#0B1220]/80 p-1 border border-slate-200/80 dark:border-border/50 shrink-0 shadow-2xs dark:shadow-inner">
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
                    ? "bg-white dark:bg-[#16A477]/25 border border-slate-200/80 dark:border-[#16A477]/50 text-slate-900 dark:text-white shadow-2xs dark:shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-[#16A477] dark:text-[#59C8E8]" : "text-slate-400 dark:text-slate-400"
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
            <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <Calendar className="h-3.5 w-3.5 text-[#16A477] dark:text-primary" />
              <span className="hidden xl:inline">Delivery:</span>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100/90 dark:bg-[#0B1220]/80 p-0.5 border border-slate-200/80 dark:border-border/50 shadow-2xs dark:shadow-inner">
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
                        ? "bg-white dark:bg-[#14283A] text-slate-900 dark:text-white font-semibold shadow-2xs border border-slate-200/80 dark:border-slate-700"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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
                    ? "bg-white dark:bg-[#14283A] text-slate-900 dark:text-white font-semibold shadow-2xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Date Form Dropdown */}
            {showCustomDates && (
              <form
                onSubmit={handleApplyCustom}
                className="flex items-center space-x-1.5 bg-white/95 dark:bg-[#14283A]/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/80 dark:border-border/70 shadow-xl animate-in fade-in-50"
              >
                <input
                  type="date"
                  min="2026-01-01"
                  max="2026-01-31"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-slate-50 dark:bg-[#0B1220]/80 border border-slate-200 dark:border-input rounded-lg px-2 py-1 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-slate-400 dark:text-slate-400 font-mono">→</span>
                <input
                  type="date"
                  min="2026-01-01"
                  max="2026-01-31"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-slate-50 dark:bg-[#0B1220]/80 border border-slate-200 dark:border-input rounded-lg px-2 py-1 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] active:scale-[0.98] cursor-pointer shadow-xs"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Decision Cutoff Selector */}
          <div className="flex items-center space-x-1.5 pl-2.5 border-l border-slate-200/80 dark:border-border/60">
            <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-[#F5B84B]" />
              <span className="hidden lg:inline">Cutoff:</span>
            </div>
            <select
              value={cutoffPreset}
              onChange={(e) => onCutoffChange(e.target.value as CutoffPreset)}
              className="bg-white dark:bg-[#0B1220] border border-slate-200/90 dark:border-border/80 text-slate-900 dark:text-white text-xs rounded-xl px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary/40 focus:outline-none cursor-pointer shadow-2xs dark:shadow-inner"
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
          <div className="hidden sm:flex items-center space-x-1 pl-2.5 border-l border-slate-200/80 dark:border-border/60 text-slate-500 dark:text-slate-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <Badge
              variant="outline"
              className="font-mono text-[10px] py-0 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border/60"
            >
              MW
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
