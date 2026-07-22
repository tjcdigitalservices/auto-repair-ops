import { cn } from "@/lib/utils";

export function DataTableCellStack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0 space-y-0.5", className)}>{children}</div>;
}

export function DataTablePrimaryText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("truncate text-sm font-medium leading-tight text-foreground", className)}>
      {children}
    </p>
  );
}

export function DataTableSecondaryText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("truncate text-xs leading-snug text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function formatDataTableMetaLine(parts: Array<string | null | undefined>, separator = " • ") {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(separator);
}
