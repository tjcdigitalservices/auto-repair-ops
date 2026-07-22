import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EntityDataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <Table className="[&_th]:px-3 [&_th]:text-[11px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.18em] [&_th]:text-muted-foreground [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-2.5 [&_tr]:border-border/70">
        {children}
      </Table>
    </div>
  );
}

export function EntityDataTableHeader({ children }: { children: React.ReactNode }) {
  return <TableHeader>{children}</TableHeader>;
}

export function EntityDataTableBody({ children }: { children: React.ReactNode }) {
  return <TableBody>{children}</TableBody>;
}

export function EntityDataTableRow({
  children,
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return (
    <TableRow className={className} {...props}>
      {children}
    </TableRow>
  );
}

export function EntityDataTableHead({
  children,
  className,
  sortable,
  sorted,
  onSort,
}: {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sorted?: "asc" | "desc" | false;
  onSort?: () => void;
}) {
  if (sortable && onSort) {
    return (
      <TableHead className={className}>
        <button
          type="button"
          onClick={onSort}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          {children}
          {sorted ? <span className="text-[10px]">{sorted === "asc" ? "↑" : "↓"}</span> : null}
        </button>
      </TableHead>
    );
  }

  return <TableHead className={className}>{children}</TableHead>;
}

export function EntityDataTableCell({
  children,
  className,
  ...props
}: React.ComponentProps<typeof TableCell>) {
  return (
    <TableCell className={className} {...props}>
      {children}
    </TableCell>
  );
}
