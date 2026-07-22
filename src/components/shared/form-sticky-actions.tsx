import { cn } from "@/lib/utils";

/**
 * Fixed bottom action bar for long create/edit forms.
 * Keeps Save / Cancel visible while scrolling.
 * Aligns to the main content column via --app-sidebar-offset from AppShell.
 */
export function FormStickyActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <div className="h-20 shrink-0" aria-hidden="true" />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/90",
          "md:left-[var(--app-sidebar-offset,15rem)]",
          className,
        )}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </>
  );
}
