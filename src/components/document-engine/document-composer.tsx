"use client";

import { useState } from "react";
import type { JSONContent } from "@tiptap/core";

import {
  DEFAULT_DOCUMENT_TITLE,
  type DocumentZoomMode,
} from "@/components/document-engine/constants";
import { DocumentComposerHeaderDescription } from "@/components/document-engine/document-composer-header-description";
import { DocumentHeaderActions } from "@/components/document-engine/document-header-actions";
import { DocumentToolbar } from "@/components/document-engine/document-toolbar";
import { DocumentViewport } from "@/components/document-engine/document-viewport";
import { DocumentEditorProvider } from "@/components/document-engine/hooks/document-editor-context";
import { useDocumentEditor } from "@/components/document-engine/hooks/use-document-editor";
import { normalizeDocumentJson } from "@/components/document-engine/persistence/document-content";
import { DocumentPaginatedPages } from "@/components/document-engine/document-paginated-pages";
import {
  getDocumentTemplate,
  isDocumentTemplateName,
} from "@/components/document-engine/templates/registry";
import type { DocumentTemplateName } from "@/components/document-engine/templates/types";
import type { DocumentComposerProps } from "@/components/document-engine/types";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function resolveTemplateName({
  template = "blank",
  document,
}: Pick<DocumentComposerProps, "template" | "document">): DocumentTemplateName {
  if (document?.template && isDocumentTemplateName(document.template)) {
    return document.template;
  }

  return template;
}

export function DocumentComposer({
  template = "blank",
  document,
  moduleTitle,
  moduleDescription,
  documentTitle,
  onDocumentTitleChange,
  titleInputRef,
  defaultDocumentTitle,
  businessProfile,
  initialContentJson,
  onContentJsonChange,
  onPrint,
  overflowActions,
  extraActions,
  contentPlaceholder,
  className,
  headerActions,
  saveStatus,
  revisionMetadataLabel,
}: DocumentComposerProps) {
  const [zoomMode, setZoomMode] = useState<DocumentZoomMode>("fit");
  const resolvedTemplateName = resolveTemplateName({ template, document });
  const documentTemplate = getDocumentTemplate(resolvedTemplateName);
  const resolvedDefaultTitle = defaultDocumentTitle ?? documentTemplate.defaultDocumentTitle;
  const resolvedDocumentTitle = documentTitle.trim() || resolvedDefaultTitle;
  const resolvedInitialContentJson = normalizeDocumentJson(
    document?.contentJson ?? initialContentJson ?? documentTemplate.defaultContentJson,
  );
  const resolvedPlaceholder = contentPlaceholder ?? documentTemplate.contentPlaceholder;

  const editor = useDocumentEditor({
    initialContentJson: resolvedInitialContentJson,
    contentPlaceholder: resolvedPlaceholder,
    onContentJsonChange,
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
      <div
        className={cn(
          "document-composer flex h-[calc(100dvh-3.5rem-var(--sandbox-chrome-offset,0px))] flex-col gap-2",
          className,
        )}
      >
        <div className="document-composer-chrome no-print shrink-0 space-y-2">
          <PageHeader
            title={moduleTitle}
            description={
              <DocumentComposerHeaderDescription
                moduleDescription={moduleDescription}
                saveStatus={saveStatus}
                revisionMetadataLabel={revisionMetadataLabel}
              />
            }
            titleClassName="text-xl font-semibold tracking-tight"
            actions={
              headerActions ?? (
                <DocumentHeaderActions
                  onPrint={handlePrint}
                  overflow={overflowActions ?? extraActions}
                />
              )
            }
          />

          <Input
            ref={titleInputRef}
            id="document-composer-title"
            aria-label="Document title"
            value={documentTitle}
            onChange={(event) => onDocumentTitleChange(event.target.value)}
            placeholder={resolvedDefaultTitle}
            className="h-9 max-w-xl border-border/70 bg-background text-sm font-medium shadow-none"
          />
        </div>

        <div className="document-composer-workspace flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-background">
          <DocumentToolbar />
          <DocumentViewport zoomMode={zoomMode} onZoomChange={setZoomMode}>
            <DocumentPaginatedPages
              template={documentTemplate}
              baseContext={{
                businessProfile,
                documentTitle: resolvedDocumentTitle,
              }}
            />
          </DocumentViewport>
        </div>
      </div>
    </DocumentEditorProvider>
  );
}

export { DEFAULT_DOCUMENT_TITLE };
