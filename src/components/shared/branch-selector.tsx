"use client";

import { useTransition } from "react";

import { NativeSelect } from "@/components/ui/native-select";
import { selectBranchAction } from "@/features/settings/actions/branch-actions";
import { shouldShowBranchSelector } from "@/lib/branch-selector-visibility";
import { cn } from "@/lib/utils";

/**
 * Branch picker for data views. Renders nothing when the tenant has one active branch
 * or the current user cannot switch branches — never a disabled dropdown.
 */
export function BranchSelector({
  branches,
  selectedBranchId,
  canSwitch,
  className,
  selectClassName,
}: {
  branches: Array<{ id: string; name: string; code: string }>;
  selectedBranchId: string | null;
  canSwitch: boolean;
  className?: string;
  selectClassName?: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (!shouldShowBranchSelector({ branches, canSwitch })) {
    return null;
  }

  const resolvedBranchId = selectedBranchId ?? branches[0]?.id ?? "";

  return (
    <form
      action={(formData) => {
        startTransition(() => selectBranchAction(formData));
      }}
      className={cn("min-w-[10rem]", className)}
    >
      <NativeSelect
        name="branchId"
        value={resolvedBranchId}
        disabled={isPending || branches.length === 0}
        aria-label="Branch"
        className={cn("h-10", selectClassName)}
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </NativeSelect>
    </form>
  );
}
