"use client";

import { getMergeVariable } from "@/components/document-engine/variables/registry";
import type { MergeVariableRenderProps } from "@/components/document-engine/variables/types";
import { cn } from "@/lib/utils";

export function MergeVariableChip({
  variableId,
  selected = false,
  className,
}: MergeVariableRenderProps & { className?: string }) {
  const variable = getMergeVariable(variableId);
  const label = variable?.label ?? variableId;

  return (
    <span
      className={cn(
        "document-merge-variable inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-900",
        selected && "ring-2 ring-sky-300",
        className,
      )}
      data-variable-id={variableId}
      contentEditable={false}
    >
      {`{{${label}}}`}
    </span>
  );
}
