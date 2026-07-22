import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeTone = "default" | "success" | "warning" | "destructive" | "info" | "neutral";

function StatusDot({ tone }: { tone: StatusBadgeTone }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        tone === "success" && "bg-success",
        tone === "warning" && "bg-warning",
        tone === "destructive" && "bg-destructive",
        tone === "info" && "bg-[hsl(var(--info))]",
        tone === "default" && "bg-primary",
        tone === "neutral" && "bg-muted-foreground/70",
      )}
    />
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusBadgeTone;
  variant?: "default" | "table";
  className?: string;
}) {
  const isTable = variant === "table";

  return (
    <Badge
      variant={
        tone === "default"
          ? "default"
          : tone === "success"
            ? "success"
            : tone === "warning"
              ? "warning"
              : tone === "destructive"
                ? "destructive"
                : tone === "info"
                  ? "info"
                  : "neutral"
      }
      className={cn(
        isTable && "gap-1.5 px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal",
        className,
      )}
    >
      {isTable ? <StatusDot tone={tone} /> : null}
      {children}
    </Badge>
  );
}
