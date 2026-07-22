import { AppLink } from "@/components/shared/app-link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
  titleClassName,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  titleClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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

        <div className="min-w-0 space-y-1">
          <h1
            className={cn(
              "text-[1.75rem] font-semibold tracking-tight text-foreground",
              titleClassName,
            )}
          >
            {title}
          </h1>
          {description ? (
            <div className="text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:shrink-0 xl:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
