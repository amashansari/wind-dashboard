import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Compass,
  BarChart3,
  Wind,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  X,
  RefreshCw,
  Clock,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import type { ActiveTab, CutoffPreset } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select } from "./ui/select";
import { DateRangePicker } from "./ui/date-picker";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  startDate: string;
  endDate: string;
  cutoffPreset: CutoffPreset;
  onDateChange: (start: string, end: string) => void;
  onCutoffChange: (preset: CutoffPreset) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  ukTime?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  startDate,
  endDate,
  cutoffPreset,
  onDateChange,
  onCutoffChange,
  onRefresh,
  isLoading = false,
  ukTime = "",
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onMobileClose]);

  const navItems = [
    {
      id: "overview" as ActiveTab,
      label: "Overview",
      description: "Headline KPIs & Outturn Curve",
      icon: LayoutDashboard,
    },
    {
      id: "explorer" as ActiveTab,
      label: "Forecast Explorer",
      description: "Settlement Grid & Vintage Audit",
      icon: Compass,
    },
    {
      id: "accuracy" as ActiveTab,
      label: "Accuracy Analysis",
      description: "Lead-Time Decay & Error Audit",
      icon: BarChart3,
    },
  ];

  const presets = [
    { label: "Jan 1–7", start: "2026-01-01", end: "2026-01-07" },
    { label: "Jan 8–14", start: "2026-01-08", end: "2026-01-14" },
    { label: "Jan 15–21", start: "2026-01-15", end: "2026-01-21" },
    { label: "Jan 22–31", start: "2026-01-22", end: "2026-01-31" },
    { label: "Full Month", start: "2026-01-01", end: "2026-01-31" },
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

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Mobile Drawer Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-[#E5EAF0] transition-all duration-200 flex flex-col shrink-0 ${
          isCollapsed ? "lg:w-[68px]" : "lg:w-[250px]"
        } ${
          isMobileOpen
            ? "translate-x-0 w-76 max-w-[85vw] shadow-2xl"
            : "-translate-x-full lg:translate-x-0 shadow-none"
        }`}
      >
        {/* Brand & Top Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#E5EAF0] shrink-0">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-[#E9F7F1] border border-emerald-200 flex items-center justify-center text-[#159B76] shrink-0">
              <Wind className="h-4.5 w-4.5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm text-[#172033] tracking-tight truncate">
                    Aerolytics
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#E9F7F1] text-[#159B76] border border-emerald-200 font-semibold">
                    UK
                  </span>
                </div>
                <span className="text-[10px] text-[#667085] uppercase font-mono tracking-wider truncate">
                  Energy Analytics
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 rounded-lg border border-[#E5EAF0] items-center justify-center text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Scrollable Center Content: Navigation & Filters */}
        <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
          {/* Navigation Section */}
          <div className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
                Intelligence Views
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? "bg-[#E9F7F1] text-[#159B76] font-semibold border border-emerald-200"
                      : "text-[#667085] hover:bg-[#F5F7FA] hover:text-[#172033] font-medium border border-transparent"
                  } ${isCollapsed && !isMobileOpen ? "justify-center" : "space-x-2.5"}`}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                      isActive ? "text-[#159B76]" : "text-[#667085]"
                    }`}
                  />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="overflow-hidden">
                      <div className="truncate text-[#172033] font-semibold">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[#667085] font-normal truncate">
                        {item.description}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}

            {isCollapsed && !isMobileOpen && (
              <div className="pt-2 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setIsCollapsed(false)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA] transition-colors border border-dashed border-[#E5EAF0] cursor-pointer"
                  title="Expand to adjust filters (Dates, Cutoff)"
                >
                  <SlidersHorizontal className="h-4 w-4 text-[#159B76]" />
                </button>
              </div>
            )}
          </div>

          {/* Filters Section (Full view when expanded or in mobile drawer) */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="pt-3 border-t border-[#E5EAF0] space-y-3.5">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
                Filters &amp; Horizon
              </div>

              {/* Delivery Period Presets */}
              <div className="space-y-1.5 px-1">
                <div className="flex items-center space-x-1.5 text-xs text-[#172033] font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-[#159B76]" />
                  <span>Delivery Presets</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {presets.map((p) => {
                    const isActive = startDate === p.start && endDate === p.end;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => onDateChange(p.start, p.end)}
                        className={`px-2 py-1 text-[11px] rounded-md transition-all cursor-pointer text-center truncate ${
                          isActive
                            ? "bg-[#E9F7F1] text-[#159B76] font-semibold border border-emerald-300 shadow-2xs"
                            : "bg-[#F5F7FA] text-[#667085] hover:text-[#172033] border border-[#E5EAF0]"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Range Picker */}
              <div className="space-y-1.5 px-1">
                <div className="text-[11px] text-[#667085] font-medium">
                  Custom Range:
                </div>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDateChange={onDateChange}
                  className="w-full"
                />
              </div>

              {/* Forecast Cutoff Selector */}
              <div className="space-y-1.5 px-1">
                <div className="flex items-center space-x-1.5 text-xs text-[#172033] font-semibold">
                  <Clock className="h-3.5 w-3.5 text-[#E8A23A]" />
                  <span>Decision Cutoff</span>
                </div>
                <Select
                  value={cutoffPreset}
                  onValueChange={(val) => onCutoffChange(val as CutoffPreset)}
                  options={cutoffOptions}
                  className="w-full"
                />
              </div>

              {/* Unit Indicator */}
              <div className="px-1 flex items-center justify-between text-xs pt-1">
                <span className="text-[#667085] flex items-center space-x-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Unit:</span>
                </span>
                <Badge variant="outline" className="text-[10px] font-mono text-[#159B76] border-emerald-200 bg-[#E9F7F1]">
                  MW (Megawatts)
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-3 border-t border-[#E5EAF0] space-y-2.5 shrink-0 bg-white">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="bg-[#F5F7FA] rounded-lg p-2.5 space-y-2 text-xs border border-[#E5EAF0]">
              <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#159B76]"></span>
                </span>
                <span className="font-semibold text-[#172033] text-[11px]">
                  No Look-Ahead Guard
                </span>
              </div>
              <p className="text-[10px] text-[#667085] leading-relaxed">
                Strict gate-closure reconstruction ensures zero future information leakage.
              </p>

              <div className="pt-1.5 border-t border-[#E5EAF0] flex items-center justify-between text-[10px] text-[#667085]">
                <span className="flex items-center space-x-1">
                  <Database className="h-3 w-3 text-[#159B76]" />
                  <span>Elexon BMRS</span>
                </span>
                <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-[#159B76] border-emerald-200 bg-[#E9F7F1]">
                  Jan 2026
                </Badge>
              </div>

              {ukTime && (
                <div className="flex items-center justify-between text-[10px] text-[#667085]">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-[#159B76]" />
                    <span>UK Time</span>
                  </span>
                  <span className="font-mono font-semibold text-[#172033]">{ukTime}</span>
                </div>
              )}

              {/* Mobile Refresh Button */}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="w-full h-8 text-xs font-semibold gap-2 mt-1 border-[#E5EAF0] bg-white hover:bg-[#F5F7FA]"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      isLoading ? "animate-spin text-[#159B76]" : "text-[#667085]"
                    }`}
                  />
                  <span>{isLoading ? "Refreshing..." : "Refresh Data"}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <span title="Look-Ahead Guard Active">
                <ShieldCheck className="h-5 w-5 text-[#159B76]" />
              </span>
              <span title="Elexon BMRS January 2026">
                <Database className="h-4 w-4 text-[#667085]" />
              </span>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="p-1 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA] transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isLoading ? "animate-spin text-[#159B76]" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          )}

          {/* Source Link */}
          {(!isCollapsed || isMobileOpen) && (
            <a
              href="https://bmrs.elexon.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-1 py-0.5 text-[11px] text-[#667085] hover:text-[#172033] transition-colors"
            >
              <span>Elexon Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
