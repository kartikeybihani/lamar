"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningBannerProps {
  message: string;
  show: boolean;
  onDismiss?: () => void;
  className?: string;
}

export default function WarningBanner({
  message,
  show,
  onDismiss,
  className,
}: WarningBannerProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg",
        "animate-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <p className="text-sm text-yellow-800 font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-yellow-600 hover:text-yellow-800 transition-colors"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
