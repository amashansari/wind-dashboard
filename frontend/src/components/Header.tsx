import { useEffect, useState } from "react";
import { RefreshCw, Wind, ShieldCheck, Database, Clock, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../lib/utils";
import type { ActiveTab, HealthResponse, MetadataResponse } from "../types";

interface HeaderProps {
  activeTab?: ActiveTab;
  health: HealthResponse | null;
  metadata: MetadataResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  startDate?: string;
  endDate?: string;
  onMenuClick?: () => void;
}

export function Header({
  health: _health,
  metadata: _metadata,
  isLoading,
  onRefresh,
  onMenuClick,
}: HeaderProps) {
  const [ukTime, setUkTime] = useState<string>("");
  const { theme, setTheme } = useTheme();

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

  return (
    <header className="border-b border-slate-200/80 dark:border-border/60 bg-white/95 dark:bg-[#0B1220]/85 backdrop-blur-xl sticky top-0 z-40 transition-colors shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Title & Mobile Menu Toggle */}
        <div className="flex items-center space-x-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-border/60 text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted/40 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-[#16A477] dark:text-emerald-400 shadow-[0_0_15px_rgba(22,164,119,0.15)] dark:shadow-[0_0_15px_rgba(22,164,119,0.2)] shrink-0">
            <Wind className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                UK Wind Procurement Intelligence
              </h1>
              <Badge variant="lime" className="text-[10px] uppercase font-mono py-0 font-semibold hidden xs:inline-flex">
                Live 2026
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 hidden sm:block">
              Day-Ahead Electricity Trading &amp; Renewable Generation Forecast Analytics
            </p>
          </div>
        </div>

        {/* Right Info Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Live UK Local Clock */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-[#14283A] border border-slate-200/80 dark:border-border/60 text-xs shadow-xs dark:shadow-inner">
            <Clock className="h-3.5 w-3.5 text-[#16A477] dark:text-[#59C8E8]" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
              UK Time:
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
              {ukTime || "--:--:--"}
            </span>
          </div>

          {/* Dataset Status */}
          <div className="hidden lg:flex items-center space-x-1.5 pl-3 border-l border-slate-200/80 dark:border-border/60">
            <Database className="h-4 w-4 text-[#16A477] dark:text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Elexon BMRS: </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Jan 2026 (Verified)</span>
            </div>
          </div>

          {/* Guard Status Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/25 dark:border-emerald-500/30 px-2.5 py-1 rounded-xl shadow-xs dark:shadow-[0_0_10px_rgba(22,164,119,0.15)]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              No Look-Ahead
            </span>
          </div>

          {/* Apple Segmented Theme Switcher */}
          <div
            role="radiogroup"
            aria-label="Theme selection"
            className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-[#14283A] p-0.5 border border-slate-200 dark:border-border/60 text-xs shadow-2xs"
          >
            <button
              type="button"
              role="radio"
              aria-checked={theme === "light"}
              aria-label="Light theme"
              onClick={() => setTheme("light")}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer active:scale-95",
                theme === "light"
                  ? "bg-white text-amber-500 shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Light mode"
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={theme === "dark"}
              aria-label="Dark theme"
              onClick={() => setTheme("dark")}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer active:scale-95",
                theme === "dark"
                  ? "bg-[#0B1220] text-blue-400 shadow-2xs font-semibold border border-slate-700/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Dark mode"
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={theme === "system"}
              aria-label="System preference"
              onClick={() => setTheme("system")}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer active:scale-95",
                theme === "system"
                  ? "bg-white dark:bg-[#0B1220] text-emerald-600 dark:text-primary shadow-2xs font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Sync with System theme"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Refresh Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs cursor-pointer shadow-2xs hover:bg-slate-100 dark:hover:bg-muted font-medium border-slate-200/80 dark:border-border/60 text-slate-800 dark:text-slate-200"
            title="Refresh forecast and actual data snapshot"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isLoading ? "animate-spin text-primary" : "text-muted-foreground"
              }`}
            />
            <span className="hidden sm:inline">
              {isLoading ? "Refreshing..." : "Refresh"}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
