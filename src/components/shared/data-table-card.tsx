import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

export function DataTableCard({
  title,
  description,
  action,
  toolbar,
  footer,
  children,
  className,
  contentClassName,
}: {
  /** Prefer PageHeader for list pages; reserve for composite/detail layouts only. */
  title?: string;
  /** Prefer DataTablePagination for record counts on list pages. */
  description?: string;
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const hasHeader = Boolean(title || description || action);

  return (
    <SectionCard
      title={title}
      description={description}
      action={action}
      className={cn("h-fit w-full", className)}
      contentClassName="p-0"
    >
      {toolbar ? (
        <div
          className={cn(
            "border-b border-border/70 p-4",
            !hasHeader && "rounded-t-[inherit]",
          )}
        >
          {toolbar}
        </div>
      ) : null}
      <div
        className={cn(
          "h-fit p-4 has-[[data-empty-state]]:p-0",
          !hasHeader && !toolbar && "rounded-t-[inherit]",
          contentClassName,
        )}
      >
        {children}
      </div>
      {footer}
    </SectionCard>
  );
}
