import { cn } from "@/lib/utils";

export function MetadataPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "info" && "border-sky-200 bg-sky-50 text-sky-800",
        tone === "neutral" && "border-border/80 bg-muted/30 text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
