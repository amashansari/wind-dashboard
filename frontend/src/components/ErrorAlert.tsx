import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface ErrorAlertProps {
  message: string;
  onRetry: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-white p-8 text-center space-y-4 shadow-xs">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#DC6262]">
          <AlertCircle className="h-6 w-6" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-[#DC6262] tracking-tight">
          Unable to Load Procurement Data
        </h3>
        <p className="text-xs text-[#667085] max-w-md mx-auto leading-relaxed">
          {message}
        </p>
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={onRetry}
        className="bg-[#DC6262] hover:bg-[#DC6262]/90 text-white gap-2 text-xs font-semibold cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Retry Connection</span>
      </Button>
    </div>
  );
}
