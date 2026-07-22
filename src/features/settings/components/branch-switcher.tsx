"use client";

import { selectBranchAction } from "@/features/settings/actions/branch-actions";
import { Button } from "@/components/ui/button";
import { shouldShowBranchSelector } from "@/lib/branch-selector-visibility";

export function BranchSwitcher({
  branches,
  selectedBranchId,
  canSwitch,
}: {
  branches: Array<{ id: string; name: string; code: string }>;
  selectedBranchId: string;
  canSwitch: boolean;
}) {
  if (!shouldShowBranchSelector({ branches, canSwitch })) {
    return null;
  }

  return (
    <form action={selectBranchAction} className="flex flex-wrap items-end gap-3">
      <label className="min-w-[16rem] flex-1 text-sm">
        <span className="font-medium text-slate-700">Branch</span>
        <select
          name="branchId"
          defaultValue={selectedBranchId}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy"
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.code})
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="outline">
        Switch
      </Button>
    </form>
  );
}
