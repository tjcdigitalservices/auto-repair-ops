import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-empty-state=""
      className={cn(
        "flex h-fit flex-col items-center rounded-2xl border border-dashed border-border/80 bg-muted/25 px-6 py-6 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
