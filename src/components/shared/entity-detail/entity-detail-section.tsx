import { cn } from "@/lib/utils";

export function EntityDetailSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="border-t border-border/70 pt-4">{children}</div>
    </section>
  );
}

export function EntityDetailField({
  label,
  children,
  className,
}: {
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const isEmpty =
    children === null ||
    children === undefined ||
    children === false ||
    (typeof children === "string" && children.trim() === "");

  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <p className="shrink-0 text-sm text-muted-foreground">{label}</p>
      <div className="min-w-0 text-right text-sm font-medium text-slate-600">
        {isEmpty ? "-" : children}
      </div>
    </div>
  );
}
