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
}

export function Header({
  health: _health,
  metadata: _metadata,
  isLoading,
  onRefresh,
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
    <header className="border-b border-border/70 bg-card/80 dark:bg-[#161618]/80 backdrop-blur-xl sticky top-0 z-40 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Title */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
            <Wind className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                UK Wind Procurement Intelligence
              </h1>
              <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 text-muted-foreground">
                Pilot v1.0
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Day-Ahead Electricity Trading &amp; Renewable Generation Forecast Analytics
            </p>
          </div>
        </div>

        {/* Right Info Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Live UK Local Clock */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-muted/60 border border-border/60 text-xs">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground font-medium hidden md:inline">
              UK Time:
            </span>
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {ukTime || "--:--:--"}
            </span>
          </div>

          {/* Dataset Status */}
          <div className="hidden lg:flex items-center space-x-1.5 pl-3 border-l border-border/60">
            <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-xs">
              <span className="text-muted-foreground">Elexon BMRS: </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Jan 2026 (Verified)</span>
            </div>
          </div>

          {/* Guard Status Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              No Look-Ahead
            </span>
          </div>

          {/* Apple Segmented Theme Switcher */}
          <div
            role="radiogroup"
            aria-label="Theme selection"
            className="inline-flex items-center rounded-xl bg-muted/70 p-0.5 border border-border/60 text-xs"
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
                  ? "bg-card text-amber-500 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
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
                  ? "bg-card text-blue-400 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
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
                  ? "bg-card text-primary shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
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
            className="h-8 gap-1.5 text-xs cursor-pointer shadow-2xs hover:bg-muted font-medium"
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
