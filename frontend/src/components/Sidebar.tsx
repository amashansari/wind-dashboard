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
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand & Logo Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <Wind className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-foreground tracking-tight truncate">
                  Wind Intelligence
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider truncate">
                  UK Power Procurement
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 rounded-md border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                className={`w-full flex items-center rounded-lg px-3 py-2.5 text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground font-medium"
                } ${isCollapsed ? "justify-center" : "space-x-3"}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {!isCollapsed && (
                  <div className="text-left overflow-hidden">
                    <div className="truncate">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground/80 font-normal truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-3 border-t border-border space-y-3">
          {!isCollapsed ? (
            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-xs border border-border/50">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-foreground text-[11px]">
                  No Look-Ahead Guard
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Reconstructs real decision cutoff conditions without future vintage contamination.
              </p>
              <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Database className="h-3 w-3 text-emerald-600" />
                  <span>Elexon BMRS</span>
                </span>
                <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                  Jan 2026
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <span title="Look-Ahead Guard Active">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </span>
              <span title="Elexon BMRS January 2026">
                <Database className="h-4 w-4 text-muted-foreground" />
              </span>
            </div>
          )}

          {/* Source Link */}
          {!isCollapsed && (
            <a
              href="https://bmrs.elexon.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
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
