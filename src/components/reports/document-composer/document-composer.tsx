"use client";

import { useState } from "react";
import { useEditor } from "@tiptap/react";

import {
  DEFAULT_DOCUMENT_BODY_HTML,
  DEFAULT_DOCUMENT_TITLE,
  type DocumentZoomMode,
} from "@/components/reports/document-composer/constants";
import { createDocumentEditorExtensions } from "@/components/reports/document-composer/create-document-editor-extensions";
import {
  DocumentEditorProvider,
} from "@/components/reports/document-composer/document-editor-context";
import { DocumentHeaderActions } from "@/components/reports/document-composer/document-header-actions";
import { DocumentPage } from "@/components/reports/document-composer/document-page";
import { DocumentToolbar } from "@/components/reports/document-composer/document-toolbar";
import { DocumentViewport } from "@/components/reports/document-composer/document-viewport";
import type { DocumentComposerProps } from "@/components/reports/document-composer/types";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DocumentComposer({
  moduleTitle,
  moduleDescription,
  documentTitle,
  onDocumentTitleChange,
  defaultDocumentTitle = DEFAULT_DOCUMENT_TITLE,
  documentMeta,
  businessProfile,
  initialContent = DEFAULT_DOCUMENT_BODY_HTML,
  onContentChange,
  onPrint,
  overflowActions,
  extraActions,
  contentPlaceholder,
  className,
}: DocumentComposerProps) {
  const [zoomMode, setZoomMode] = useState<DocumentZoomMode>("fit");
  const resolvedDocumentTitle = documentTitle.trim() || defaultDocumentTitle;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createDocumentEditorExtensions({ placeholder: contentPlaceholder }),
    content: initialContent,
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
      onContentChange?.(currentEditor.getHTML());
    },
  });

  function handlePrint() {
    if (onPrint) {
      onPrint();
      return;
    }

    window.print();
  }

  return (
    <DocumentEditorProvider editor={editor}>
      <div className={cn("document-composer flex h-[calc(100dvh-3.5rem)] flex-col gap-2", className)}>
        <div className="document-composer-chrome no-print shrink-0 space-y-2">
          <PageHeader
            title={moduleTitle}
            description={moduleDescription}
            titleClassName="text-xl font-semibold tracking-tight"
            actions={
              <DocumentHeaderActions
                onPrint={handlePrint}
                overflow={overflowActions ?? extraActions}
              />
            }
          />

          <Input
            id="document-composer-title"
            aria-label="Document title"
            value={documentTitle}
            onChange={(event) => onDocumentTitleChange(event.target.value)}
            placeholder={defaultDocumentTitle}
            className="h-9 max-w-xl border-border/70 bg-background text-sm font-medium shadow-none"
          />
        </div>

        <div className="document-composer-workspace flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-background">
          <DocumentToolbar zoomMode={zoomMode} onZoomChange={setZoomMode} />
          <DocumentViewport zoomMode={zoomMode}>
            <DocumentPage
              businessProfile={businessProfile}
              documentTitle={resolvedDocumentTitle}
              documentMeta={documentMeta}
            />
          </DocumentViewport>
        </div>
      </div>
    </DocumentEditorProvider>
  );
}
