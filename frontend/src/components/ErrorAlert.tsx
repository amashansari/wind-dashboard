import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface ErrorAlertProps {
  message: string;
  onRetry: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-6 text-center space-y-4">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200">
          Unable to Load Procurement Data
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
          {message}
        </p>
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={onRetry}
        className="bg-rose-600 hover:bg-rose-700 text-white gap-2 text-xs"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Retry Connection</span>
      </Button>
    </div>
  );
}
