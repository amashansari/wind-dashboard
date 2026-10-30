import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onDateChange: (start: string, end: string) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectingStart, setSelectingStart] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD
  const formatDisplay = (dt: string) => {
    if (!dt) return "";
    const parts = dt.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dt;
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectingStart(null);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // January 2026 calendar days:
  // Jan 1, 2026 is Thursday (day index 4: Su=0, Mo=1, Tu=2, We=3, Th=4, Fr=5, Sa=6)
  const totalDays = 31;
  const startDayOfWeek = 4; // Thursday

  const handleDayClick = (day: number) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-01-${dayStr}`;

    if (!selectingStart) {
      // First click: select start date
      setSelectingStart(dateStr);
    } else {
      // Second click: select end date
      if (dateStr >= selectingStart) {
        onDateChange(selectingStart, dateStr);
      } else {
        onDateChange(dateStr, selectingStart);
      }
      setSelectingStart(null);
      setIsOpen(false);
    }
  };

  const isDaySelected = (day: number) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-01-${dayStr}`;

    if (selectingStart) {
      return dateStr === selectingStart;
    }
    return dateStr >= startDate && dateStr <= endDate;
  };

  const isDayStart = (day: number) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-01-${dayStr}`;
    return dateStr === (selectingStart || startDate);
  };

  const isDayEnd = (day: number) => {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-01-${dayStr}`;
    return !selectingStart && dateStr === endDate;
  };

  const presets = [
    { label: "Jan 1–7", start: "2026-01-01", end: "2026-01-07" },
    { label: "Jan 8–14", start: "2026-01-08", end: "2026-01-14" },
    { label: "Jan 15–21", start: "2026-01-15", end: "2026-01-21" },
    { label: "Jan 22–31", start: "2026-01-22", end: "2026-01-31" },
    { label: "Full Month", start: "2026-01-01", end: "2026-01-31" },
  ];

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSelectingStart(null);
        }}
        className={cn(
          "w-full flex h-8 items-center justify-between gap-2 rounded-lg border border-[#E5EAF0] bg-white px-2.5 py-1 text-xs font-medium text-[#172033] shadow-2xs hover:bg-[#F5F7FA] focus:outline-none focus:ring-1 focus:ring-[#159B76] transition-all cursor-pointer whitespace-nowrap",
          isOpen && "ring-1 ring-[#159B76] border-[#159B76]"
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-[#159B76] shrink-0" />
        <span className="font-mono text-xs tabular-nums text-[#172033]">
          {formatDisplay(startDate)} → {formatDisplay(endDate)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 z-50 w-[290px] overflow-hidden rounded-xl border border-[#E5EAF0] bg-white p-3 text-[#172033] shadow-xl animate-in fade-in-80 slide-in-from-top-1">
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5EAF0]">
            <span className="font-semibold text-xs text-[#172033]">
              January 2026
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled
                className="h-6 w-6 rounded flex items-center justify-center text-slate-300 cursor-not-allowed"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled
                className="h-6 w-6 rounded flex items-center justify-center text-slate-300 cursor-not-allowed"
                aria-label="Next month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-[10px] font-semibold text-[#667085]">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank leading slots for Thursday start */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-7 w-7" />
            ))}

            {/* 31 days */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const isSelected = isDaySelected(day);
              const isStart = isDayStart(day);
              const isEnd = isDayEnd(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "h-7 w-7 rounded-md text-xs font-medium font-mono tabular-nums transition-all flex items-center justify-center cursor-pointer",
                    isStart || isEnd
                      ? "bg-[#159B76] text-white font-bold shadow-2xs"
                      : isSelected
                      ? "bg-[#E9F7F1] text-[#159B76] font-semibold"
                      : "text-[#172033] hover:bg-[#F5F7FA]"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Presets footer */}
          <div className="mt-3 pt-2.5 border-t border-[#E5EAF0]">
            <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1.5">
              Quick Ranges:
            </div>
            <div className="flex flex-wrap gap-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    onDateChange(p.start, p.end);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "px-2 py-0.5 text-[11px] rounded border transition-colors cursor-pointer",
                    startDate === p.start && endDate === p.end
                      ? "bg-[#E9F7F1] text-[#159B76] border-emerald-300 font-semibold"
                      : "bg-[#F5F7FA] text-[#667085] border-[#E5EAF0] hover:text-[#172033]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
