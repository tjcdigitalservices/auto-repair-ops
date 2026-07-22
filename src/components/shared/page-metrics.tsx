import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PageMetricVariant =
  | "secondary"
  | "neutral"
  | "warning"
  | "destructive"
  | "outline";

const pageMetricBadgeClassName =
  "min-w-[1.75rem] justify-center px-2 py-0.5 text-xs font-semibold leading-none tabular-nums normal-case tracking-normal";

export function PageMetrics({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5", className)}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function PageMetric({
  label,
  value,
  variant = "secondary",
  active = false,
  onClick,
  className,
}: {
  label: string;
  value: string | number;
  variant?: PageMetricVariant;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value;
  const isInteractive = Boolean(onClick);
  const badgeVariant = active
    ? "outline"
    : variant === "neutral"
      ? "neutral"
      : variant;

  const content = (
    <>
      <span
        className={cn(
          "text-sm text-muted-foreground",
          active ? "font-medium text-foreground" : null,
        )}
      >
        {label}
      </span>
      <Badge
        variant={badgeVariant}
        className={cn(
          pageMetricBadgeClassName,
          active && "border-primary/30 bg-background/90 text-foreground",
        )}
      >
        {displayValue}
      </Badge>
    </>
  );

  const shellClassName = cn(
    "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors",
    active && "border border-primary/40 bg-muted/70",
    isInteractive &&
      !active &&
      "border border-transparent hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30 focus-visible:ring-offset-2",
    !isInteractive && "border border-transparent",
    className,
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(shellClassName, "cursor-pointer")}
      >
        {content}
      </button>
    );
  }

  return <span className={shellClassName}>{content}</span>;
}
