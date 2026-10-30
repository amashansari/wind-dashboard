import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-8 items-center justify-between gap-1.5 rounded-lg border border-[#E5EAF0] bg-white px-2.5 py-1 text-xs font-medium text-[#172033] shadow-2xs hover:bg-[#F5F7FA] focus:outline-none focus:ring-1 focus:ring-[#159B76] transition-all cursor-pointer whitespace-nowrap",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="truncate max-w-[210px]">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#667085] transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[240px] max-w-[320px] overflow-hidden rounded-lg border border-[#E5EAF0] bg-white p-1 text-[#172033] shadow-lg animate-in fade-in-80 slide-in-from-top-1">
          <div className="max-h-60 overflow-y-auto py-0.5 space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-xs text-left transition-colors outline-none",
                    isSelected
                      ? "bg-[#E9F7F1] text-[#159B76] font-semibold"
                      : "text-[#172033] hover:bg-[#F5F7FA]"
                  )}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="truncate">{option.label}</div>
                    {option.description && (
                      <div className="text-[10px] text-[#667085] font-normal truncate mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#159B76] absolute right-2 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
