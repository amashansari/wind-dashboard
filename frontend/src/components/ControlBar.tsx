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
import { Select } from "./ui/select";
import { DateRangePicker } from "./ui/date-picker";

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
  const presets = [
    { label: "Jan 1–7", start: "2026-01-01", end: "2026-01-07" },
    { label: "Jan 8–14", start: "2026-01-08", end: "2026-01-14" },
    { label: "Jan 15–21", start: "2026-01-15", end: "2026-01-21" },
    { label: "Jan 22–31", start: "2026-01-22", end: "2026-01-31" },
    { label: "Full Month", start: "2026-01-01", end: "2026-01-31" },
  ];

  const tabs: Array<{ id: ActiveTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "explorer", label: "Forecast Explorer", icon: Compass },
    { id: "accuracy", label: "Accuracy Analysis", icon: BarChart3 },
  ];

  const cutoffOptions = [
    {
      value: "day_ahead_12",
      label: "Day-Ahead 12:00 UTC",
      description: "D-1 Auction Gate Closure",
    },
    {
      value: "day_ahead_17",
      label: "Day-Ahead 17:00 UTC",
      description: "D-1 Evening Hedging",
    },
    {
      value: "same_day_06",
      label: "Same-Day 06:00 UTC",
      description: "Within-Day Morning Adjustment",
    },
  ];

  return (
    <div className="xl:hidden bg-white border-b border-[#E5EAF0] shadow-2xs sticky top-14 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs">
        {/* Navigation Tabs */}
        <div className="inline-flex rounded-lg bg-[#F5F7FA] p-1 border border-[#E5EAF0] shrink-0 overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white border border-[#E5EAF0] text-[#172033] shadow-2xs font-bold"
                    : "text-[#667085] hover:text-[#172033] hover:bg-white/60 font-medium"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-[#159B76]" : "text-[#667085]"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2.5 max-w-full">
          {/* Delivery Date Presets + Shadcn DatePicker */}
          <div className="flex flex-wrap items-center gap-1.5 max-w-full">
            <div className="flex items-center space-x-1 text-[#667085] font-semibold uppercase tracking-wider text-[10px]">
              <Calendar className="h-3.5 w-3.5 text-[#159B76]" />
              <span className="hidden sm:inline">Delivery:</span>
            </div>

            <div className="inline-flex flex-wrap rounded-lg bg-[#F5F7FA] p-0.5 border border-[#E5EAF0]">
              {presets.map((p) => {
                const isActive = startDate === p.start && endDate === p.end;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onDateChange(p.start, p.end)}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-white text-[#159B76] font-semibold shadow-2xs border border-[#E5EAF0]"
                        : "text-[#667085] hover:text-[#172033]"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Picker */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={onDateChange}
            />
          </div>

          {/* Decision Cutoff Selector with Shadcn Select */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-[#E5EAF0] max-w-full">
            <div className="flex items-center space-x-1 text-[#667085] font-semibold uppercase tracking-wider text-[10px] shrink-0">
              <Clock className="h-3.5 w-3.5 text-[#E8A23A]" />
              <span className="hidden sm:inline">Cutoff:</span>
            </div>
            <Select
              value={cutoffPreset}
              onValueChange={(val) => onCutoffChange(val as CutoffPreset)}
              options={cutoffOptions}
            />
          </div>

          {/* Unit Badge */}
          <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-[#E5EAF0] text-[#667085]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <Badge variant="outline" className="text-[10px] font-mono py-0 text-[#667085] border-[#E5EAF0]">
              MW
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
