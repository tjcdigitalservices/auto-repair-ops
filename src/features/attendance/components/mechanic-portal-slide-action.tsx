import { SubmitButton } from "@/components/shared/submit-button";
import { cn } from "@/lib/utils";

export function MechanicPortalSlideAction({
  children,
  disabled,
  pendingLabel,
  className,
}: {
  children: string;
  disabled?: boolean;
  pendingLabel: string;
  className?: string;
}) {
  return (
    <SubmitButton
      pendingLabel={pendingLabel}
      disabled={disabled}
      className={cn(
        "h-auto w-full rounded-[999px] bg-brand-navyStrong px-3 py-3.5 text-left text-white shadow-[0_18px_35px_hsl(var(--brand-navy-strong)/0.22)] hover:bg-brand-navy",
        "disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none",
        className,
      )}
    >
      <span className="flex min-w-0 items-center justify-center">
        <span className="truncate text-base font-semibold text-white">{children}</span>
      </span>
    </SubmitButton>
  );
}
