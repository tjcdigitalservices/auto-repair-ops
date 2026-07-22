"use client";

import {
  DOCUMENT_ZOOM_OPTIONS,
  type DocumentZoomMode,
} from "@/components/reports/document-composer/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentZoom({
  value,
  onChange,
  className,
}: {
  value: DocumentZoomMode;
  onChange: (value: DocumentZoomMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "document-composer-chrome no-print flex flex-wrap items-center gap-1",
        className,
      )}
      role="group"
      aria-label="Zoom"
    >
      {DOCUMENT_ZOOM_OPTIONS.map((option) => (
        <Button
          key={option.label}
          type="button"
          size="sm"
          variant={value === option.value ? "secondary" : "ghost"}
          className="h-7 px-2.5 text-xs"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export type { DocumentZoomMode };
