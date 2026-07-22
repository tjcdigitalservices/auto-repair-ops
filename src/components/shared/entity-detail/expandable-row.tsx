"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function ExpandableRow({
  expanded,
  onToggle,
  header,
  children,
  className,
}: {
  expanded: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border/70 last:border-b-0", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 px-1 py-4 text-left transition-colors hover:bg-muted/20"
      >
        <div className="min-w-0 flex-1">{header}</div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/50 bg-muted/10 px-4 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
