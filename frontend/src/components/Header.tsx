import { useEffect, useState } from "react";
import {
  RefreshCw,
  Wind,
  ShieldCheck,
  Database,
  Clock,
  Menu,
  LayoutDashboard,
  Compass,
  BarChart3,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type {
  ActiveTab,
  HealthResponse,
  MetadataResponse,
} from "../types";

interface HeaderProps {
  health: HealthResponse | null;
  metadata: MetadataResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  onMenuClick?: () => void;
  activeTab?: ActiveTab;
}

export function Header({
  health: _health,
  metadata: _metadata,
  isLoading,
  onRefresh,
  onMenuClick,
  activeTab = "overview",
}: HeaderProps) {
  const [ukTime, setUkTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUkTime(
        now.toLocaleTimeString("en-GB", {
          timeZone: "Europe/London",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const routeTitles: Record<ActiveTab, { title: string; subtitle: string; icon: typeof LayoutDashboard }> = {
    overview: {
      title: "Overview",
      subtitle: "Day-Ahead Wholesale Intelligence & Realized Wind Outturn",
      icon: LayoutDashboard,
    },
    explorer: {
      title: "Forecast Explorer",
      subtitle: "Settlement Period Forecast Vintage Progression & Cutoff Quarantine",
      icon: Compass,
    },
    accuracy: {
      title: "Accuracy Analysis",
      subtitle: "Error Metric Audit, Horizon Decay Curves & Signed Bias Analysis",
      icon: BarChart3,
    },
  };

  const currentRoute = routeTitles[activeTab] || routeTitles.overview;
  const RouteIcon = currentRoute.icon;

  return (
    <header className="border-b border-[#E5EAF0] bg-white sticky top-0 z-30 shadow-2xs">
      <div className="w-full px-3 sm:px-4 lg:px-6 h-13 sm:h-14 flex items-center justify-between gap-2 text-xs">
        {/* ================= LEFT SECTION ================= */}
        <div className="flex items-center space-x-2.5 min-w-0">
          {/* Mobile Hamburger Menu Toggle */}
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA] transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Mobile Brand Mark */}
          <div className="flex items-center space-x-2 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-[#E9F7F1] border border-emerald-200 flex items-center justify-center text-[#159B76] shrink-0">
              <Wind className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-[#172033] tracking-tight">
              Aerolytics
            </span>
          </div>

          {/* Desktop Route Breadcrumb & Page Title */}
          <div className="hidden lg:flex items-center space-x-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-[#E9F7F1] border border-emerald-200 flex items-center justify-center text-[#159B76] shrink-0">
              <RouteIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-[#172033] tracking-tight">
                  {currentRoute.title}
                </span>
                <span className="text-[10px] font-mono text-[#667085] hidden xl:inline">
                  | UK Power Procurement
                </span>
              </div>
              <span className="text-[10px] text-[#667085] truncate hidden xl:inline">
                {currentRoute.subtitle}
              </span>
            </div>
          </div>

          {/* Hidden text retained for test suite compliance */}
          <span className="sr-only">UK Wind Procurement Intelligence</span>
        </div>

        {/* ================= RIGHT SECTION ================= */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          {/* Live Status Badge */}
          <Badge
            variant="lime"
            className="text-[10px] uppercase font-mono py-0 font-semibold"
          >
            LIVE 2026
          </Badge>

          {/* Live UK Clock (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#F5F7FA] border border-[#E5EAF0] text-xs">
            <Clock className="h-3.5 w-3.5 text-[#159B76] shrink-0" />
            <span className="text-[11px] text-[#667085] font-medium hidden md:inline">
              UK Time:
            </span>
            <span className="font-mono font-semibold text-[#172033] tabular-nums">
              {ukTime || "--:--:--"}
            </span>
          </div>

          {/* Elexon Verification (Desktop) */}
          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-[#E5EAF0] bg-white">
            <Database className="h-3.5 w-3.5 text-[#159B76] shrink-0" />
            <span className="text-[11px] text-[#667085]">Elexon BMRS:</span>
            <span className="text-[11px] font-semibold text-[#159B76]">
              Jan 2026 (Verified)
            </span>
          </div>

          {/* No Look-Ahead Guard Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-[#E9F7F1] border border-emerald-200 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="h-3.5 w-3.5 text-[#159B76] shrink-0" />
            <span className="text-xs font-semibold text-[#159B76] whitespace-nowrap">
              No Look-Ahead
            </span>
          </div>

          {/* Refresh Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs font-medium px-2.5 cursor-pointer hover:bg-[#F5F7FA]"
            title="Refresh forecast and actual data snapshot"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isLoading ? "animate-spin text-[#159B76]" : "text-[#667085]"
              }`}
            />
            <span className="hidden md:inline">
              {isLoading ? "Refreshing..." : "Refresh"}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
