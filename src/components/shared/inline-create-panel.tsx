"use client";

import { useCallback, useEffect, useId } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Responsive inline-create shell: centered modal on small screens, right-side sheet on lg+.
 * Reuse for customer, supplier, catalog, and lookup inline-create flows.
 */
export function InlineCreatePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: (controls: { closePanel: () => void }) => React.ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();

  const closePanel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePanel, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex justify-center bg-slate-950/45 backdrop-blur-[2px] lg:justify-end"
      onMouseDown={closePanel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden border border-border/70 bg-background shadow-2xl shadow-slate-950/15",
          "mt-4 max-w-lg rounded-3xl sm:max-h-[calc(100dvh-3rem)]",
          "lg:mt-0 lg:h-dvh lg:max-h-none lg:max-w-md lg:rounded-none lg:border-l lg:border-t-0 lg:border-r-0 lg:border-b-0",
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
          <div className="space-y-1">
            <h2 id={titleId} className="text-base font-semibold text-foreground">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="size-8 p-0"
            onClick={closePanel}
            aria-label="Close panel"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {children({ closePanel })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
