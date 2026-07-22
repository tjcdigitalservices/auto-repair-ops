import { AppLink } from "@/components/shared/app-link";
import { ChevronLeft } from "lucide-react";

import { PageHeaderActions } from "@/components/shared/page-header-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EntityDetailHeader({
  title,
  description,
  metadata,
  actions,
  backHref,
  backLabel = "Back",
  className,
}: {
  title: string;
  description?: string;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border/70 pb-6 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Button
            asChild
            variant="outline"
            size="icon"
            className="mt-1 size-9 shrink-0 rounded-full border-border/80 bg-background text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground"
          >
            <AppLink href={backHref} aria-label={backLabel} title={backLabel}>
              <ChevronLeft className="size-4" />
            </AppLink>
          </Button>
        ) : null}

        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {metadata ? <div className="flex flex-wrap items-center gap-2">{metadata}</div> : null}
        </div>
      </div>

      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0 lg:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function EntityDetailActions({
  children,
  primary,
  overflow,
}: {
  children?: React.ReactNode;
  primary?: React.ReactNode;
  overflow?: React.ReactNode;
}) {
  if (primary || overflow) {
    return <PageHeaderActions primary={primary} overflow={overflow} />;
  }

  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}
