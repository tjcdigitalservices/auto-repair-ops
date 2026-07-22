import { AppLink } from "@/components/shared/app-link";
import type { LucideIcon } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared hover/elevation treatment for every clickable summary/stat card. */
export const interactiveStatCardClassName =
  "cursor-pointer transition-[box-shadow,border-color,background-color] hover:border-brand-navy/30 hover:bg-muted/35 hover:shadow-md";

/** Shared keyboard focus ring for clickable summary/stat card wrappers. */
export const interactiveStatCardFocusClassName =
  "rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/30";

export function InteractiveStatCardLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AppLink
      href={href}
      className={cn("block w-full text-left", interactiveStatCardFocusClassName, className)}
    >
      {children}
    </AppLink>
  );
}

export function InteractiveStatCardButton({
  onClick,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "block w-full cursor-pointer text-left",
        interactiveStatCardFocusClassName,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function StatCard({
  title,
  value,
  description,
  badge,
  icon: Icon,
  tone = "default",
  className,
  href,
  onClick,
}: {
  title: string;
  value: string;
  description?: string;
  badge?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive" | "info" | "neutral";
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const isInteractive = Boolean(href || onClick);

  const card = (
    <Card
      className={cn(
        "overflow-hidden",
        isInteractive ? interactiveStatCardClassName : null,
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          </div>
          {Icon ? (
            <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Icon className="size-5" />
            </div>
          ) : null}
        </div>
        {description || badge ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : <span />}
            {badge ? <StatusBadge tone={tone}>{badge}</StatusBadge> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return <InteractiveStatCardLink href={href}>{card}</InteractiveStatCardLink>;
  }

  if (onClick) {
    return (
      <InteractiveStatCardButton onClick={onClick}>{card}</InteractiveStatCardButton>
    );
  }

  return card;
}
