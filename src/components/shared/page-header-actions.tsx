import { AppLink } from "@/components/shared/app-link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function PageHeaderActions({
  primary,
  overflow,
  className,
}: {
  primary?: React.ReactNode;
  overflow?: React.ReactNode;
  className?: string;
}) {
  if (!primary && !overflow) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {primary}
      {overflow}
    </div>
  );
}

export function PagePrimaryAction({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button asChild className={className}>
      <AppLink href={href}>{children}</AppLink>
    </Button>
  );
}

export function PageOverflowMenu({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={className}
          aria-label={label}
          title={label}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
