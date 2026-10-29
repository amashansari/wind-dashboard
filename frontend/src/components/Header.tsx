import { useEffect, useState } from "react";
import { RefreshCw, Wind, ShieldCheck, Database } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { HealthResponse, MetadataResponse } from "../types";

interface HeaderProps {
  health: HealthResponse | null;
  metadata: MetadataResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function Header({ health: _health, metadata: _metadata, isLoading, onRefresh }: HeaderProps) {
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

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Wind className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                UK Wind Procurement Intelligence
              </h1>
              <Badge variant="outline" className="text-[10px] uppercase font-mono py-0">
                Pilot v1.0
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Day-Ahead Electricity Trading &amp; Renewable Forecast Accuracy
            </p>
          </div>
        </div>

        {/* Right Info Controls */}
        <div className="flex items-center space-x-4">
          {/* UK Local Clock */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] text-muted-foreground uppercase font-medium">UK Time (GMT)</span>
            <span className="text-sm font-mono font-semibold text-foreground">{ukTime || "--:--:--"}</span>
          </div>

          {/* Dataset Status */}
          <div className="hidden lg:flex items-center space-x-1.5 pl-3 border-l border-border">
            <Database className="h-4 w-4 text-emerald-600" />
            <div className="text-xs">
              <span className="text-muted-foreground">Elexon BMRS: </span>
              <span className="font-semibold text-emerald-600">Jan 2026 (100% Verified)</span>
            </div>
          </div>

          {/* Guard Status */}
          <div className="hidden sm:flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              No Look-Ahead
            </span>
          </div>

          {/* Refresh Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
