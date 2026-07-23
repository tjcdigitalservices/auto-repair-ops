"use client";

import { EditorContent } from "@tiptap/react";

import { useDocumentEditorContext } from "@/components/document-engine/hooks/document-editor-context";
import { cn } from "@/lib/utils";

/**
 * Editable document body region. Contains only the TipTap editor instance.
 */
export function DocumentBody({ className }: { className?: string }) {
  const editor = useDocumentEditorContext();

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "document-editor-surface flex min-h-0 flex-1 flex-col",
        "[&_.ProseMirror]:min-h-full [&_.ProseMirror]:flex-1 [&_.ProseMirror]:outline-none",
        "[&_.ProseMirror]:cursor-text",
        className,
      )}
    />
  );
}
