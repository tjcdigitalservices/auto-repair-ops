"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

import { MergeVariableChip } from "@/components/document-engine/variables/merge-variable-chip";

export function MergeVariableNodeView({ node, selected }: NodeViewProps) {
  const variableId = String(node.attrs.variableId ?? "");

  return (
    <NodeViewWrapper as="span" className="inline">
      <MergeVariableChip variableId={variableId} selected={selected} />
    </NodeViewWrapper>
  );
}
