import { AppLink } from "@/components/shared/app-link";
import { cn } from "@/lib/utils";

export function EntityDetailLink({
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
      className={cn(
        "font-medium text-brand-navy underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
    </AppLink>
  );
}
