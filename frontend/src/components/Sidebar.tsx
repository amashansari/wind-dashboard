import { useState } from "react";
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
} from "lucide-react";
import type { ActiveTab } from "../types";
import { Badge } from "./ui/badge";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const handleNavClick = (tab: ActiveTab) => {
    onTabChange(tab);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white/95 dark:bg-[#14283A]/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-border/60 transition-all duration-300 flex flex-col shadow-sm dark:shadow-2xl ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand & Logo Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-border/60">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-[#16A477] dark:text-emerald-400 shadow-[0_0_15px_rgba(22,164,119,0.15)] dark:shadow-[0_0_15px_rgba(22,164,119,0.25)] shrink-0">
              <Wind className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight truncate">
                    Aerolytics
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                    UK
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider truncate">
                  Wind Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 rounded-lg border border-slate-200/80 dark:border-border/70 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Procurement Views
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
                className={`w-full flex items-center rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer relative ${
                  isActive
                    ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-950 dark:text-white font-semibold shadow-xs border border-emerald-500/25 dark:border-emerald-500/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-[#0B1220]/60 hover:text-slate-900 dark:hover:text-white font-medium"
                } ${isCollapsed ? "justify-center" : "space-x-3"}`}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#16A477] rounded-r-full shadow-[0_0_8px_#16A477]" />
                )}
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? "text-[#16A477] dark:text-[#59C8E8]" : "text-slate-400 dark:text-slate-400"
                  }`}
                />
                {!isCollapsed && (
                  <div className="text-left overflow-hidden">
                    <div className="truncate text-slate-900 dark:text-white font-semibold">{item.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-3 border-t border-slate-200/80 dark:border-border/60 space-y-3">
          {!isCollapsed ? (
            <div className="bg-slate-50 dark:bg-[#0B1220]/90 rounded-xl p-3 space-y-2 text-xs border border-slate-200/80 dark:border-border/60 shadow-xs dark:shadow-inner">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white text-[11px]">
                  No Look-Ahead Guard
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Strict gate-closure reconstruction ensures zero future information leakage into historical decisions.
              </p>
              <div className="pt-1.5 border-t border-slate-200/70 dark:border-border/50 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1">
                  <Database className="h-3 w-3 text-[#16A477] dark:text-[#59C8E8]" />
                  <span>Elexon BMRS</span>
                </span>
                <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-emerald-700 dark:text-[#B7F36B] border-emerald-500/30 dark:border-lime-500/30 bg-emerald-50/50 dark:bg-transparent">
                  Jan 2026
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <span title="Look-Ahead Guard Active">
                <ShieldCheck className="h-5 w-5 text-[#16A477] dark:text-emerald-400" />
              </span>
              <span title="Elexon BMRS January 2026">
                <Database className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              </span>
            </div>
          )}

          {/* Source Link */}
          {!isCollapsed && (
            <a
              href="https://bmrs.elexon.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>Elexon Insights Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
