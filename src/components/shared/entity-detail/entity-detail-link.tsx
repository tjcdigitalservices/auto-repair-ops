import type { ComponentProps } from "react";

import { AppLink } from "@/components/shared/app-link";
import { cn } from "@/lib/utils";

type EntityDetailLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
} & Pick<ComponentProps<typeof AppLink>, "target" | "rel">;

export function EntityDetailLink({
  href,
  children,
  className,
  target,
  rel,
}: EntityDetailLinkProps) {
  return (
    <AppLink
      href={href}
      target={target}
      rel={rel}
      className={cn(
        "font-medium text-brand-navy underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
    </AppLink>
  );
}
