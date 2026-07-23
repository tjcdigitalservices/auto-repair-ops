"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

import { getDocumentBlock } from "@/components/document-engine/blocks/registry";
import { NotesBlock } from "@/components/document-engine/blocks/definitions";

export function DocumentBlockNodeView({ node, selected, updateAttributes }: NodeViewProps) {
  const blockId = String(node.attrs.blockId ?? "");
  const definition = getDocumentBlock(blockId);
  const notesText = String(node.attrs.notesText ?? "");

  if (!definition) {
    return (
      <NodeViewWrapper className="document-block-wrapper my-2">
        <div className="rounded-md border border-dashed border-destructive/40 p-3 text-xs text-destructive">
          Unknown block: {blockId}
        </div>
      </NodeViewWrapper>
    );
  }

  const RenderComponent = definition.RenderComponent;

  return (
    <NodeViewWrapper className="document-block-wrapper my-2" data-block-id={blockId}>
      {blockId === "notes" ? (
        <NotesBlock
          selected={selected}
          notesText={notesText}
          onNotesTextChange={(value) => updateAttributes({ notesText: value })}
        />
      ) : (
        <RenderComponent selected={selected} />
      )}
    </NodeViewWrapper>
  );
}
