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
  X,
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
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-[#E5EAF0] transition-all duration-200 flex flex-col shrink-0 ${
          isCollapsed ? "w-18" : "w-64"
        } ${
          isMobileOpen
            ? "translate-x-0 shadow-xl"
            : "-translate-x-full lg:translate-x-0 shadow-none"
        }`}
      >
        {/* Brand & Logo Header */}
        <div className="h-14 sm:h-16 px-4 flex items-center justify-between border-b border-[#E5EAF0]">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-[#E9F7F1] border border-emerald-200 flex items-center justify-center text-[#159B76] shrink-0">
              <Wind className="h-5 w-5" />
            </div>
            {!isCollapsed && (
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

        {/* Navigation Items */}
        <div className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
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
                } ${isCollapsed ? "justify-center" : "space-x-2.5"}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                    isActive ? "text-[#159B76]" : "text-[#667085]"
                  }`}
                />
                {!isCollapsed && (
                  <div className="overflow-hidden">
                    <div className="truncate text-[#172033] font-semibold">{item.label}</div>
                    <div className="text-[10px] text-[#667085] font-normal truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-3 border-t border-[#E5EAF0] space-y-2.5">
          {!isCollapsed ? (
            <div className="bg-[#F5F7FA] rounded-lg p-2.5 space-y-1.5 text-xs border border-[#E5EAF0]">
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
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <span title="Look-Ahead Guard Active">
                <ShieldCheck className="h-5 w-5 text-[#159B76]" />
              </span>
              <span title="Elexon BMRS January 2026">
                <Database className="h-4 w-4 text-[#667085]" />
              </span>
            </div>
          )}

          {/* Source Link */}
          {!isCollapsed && (
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
