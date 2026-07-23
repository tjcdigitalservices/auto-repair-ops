"use client";

import type { JSONContent } from "@tiptap/core";
import { useEditor } from "@tiptap/react";

import { EMPTY_DOCUMENT_JSON, normalizeDocumentJson } from "@/components/document-engine/persistence/document-content";
import { DOCUMENT_EDITOR_PLACEHOLDER } from "@/components/document-engine/constants";
import { createDocumentEditorExtensions } from "@/components/document-engine/create-document-editor-extensions";
import { cn } from "@/lib/utils";

export function useDocumentEditor({
  initialContentJson = EMPTY_DOCUMENT_JSON,
  contentPlaceholder = DOCUMENT_EDITOR_PLACEHOLDER,
  onContentJsonChange,
}: {
  initialContentJson?: JSONContent;
  contentPlaceholder?: string;
  onContentJsonChange?: (contentJson: JSONContent) => void;
}) {
  return useEditor({
    immediatelyRender: false,
    extensions: createDocumentEditorExtensions({ placeholder: contentPlaceholder }),
    content: normalizeDocumentJson(initialContentJson),
    editorProps: {
      attributes: {
        id: "document-composer-body",
        "aria-label": "Document Body",
        class: cn(
          "document-editor-content min-h-full text-[12px] leading-[1.68] text-slate-800 outline-none",
          "focus:outline-none",
        ),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onContentJsonChange?.(currentEditor.getJSON());
    },
  });
}
