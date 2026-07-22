import { cn } from "@/lib/utils";

export function EntityDetailSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/70 bg-background", className)}>
      <div className="space-y-8 p-5">{children}</div>
    </div>
  );
}
