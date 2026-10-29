import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface ErrorAlertProps {
  message: string;
  onRetry: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="rounded-3xl border border-rose-500/25 bg-white dark:bg-[#14283A]/90 backdrop-blur-xl p-8 text-center space-y-4 shadow-md dark:shadow-xl">
      <div className="flex justify-center">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-[#FF5A76] shadow-inner">
          <AlertCircle className="h-7 w-7" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-rose-700 dark:text-rose-200 tracking-tight">
          Unable to Load Procurement Data
        </h3>
        <p className="text-xs text-rose-600/90 dark:text-rose-300/80 max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={onRetry}
        className="bg-rose-600 hover:bg-rose-500 text-white gap-2 text-xs shadow-xs font-semibold cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Retry Connection</span>
      </Button>
    </div>
  );
}
