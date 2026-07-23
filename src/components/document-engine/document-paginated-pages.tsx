"use client";

import { useRef } from "react";

import { DocumentBody } from "@/components/document-engine/document-body";
import { useDocumentEditorContext } from "@/components/document-engine/hooks/document-editor-context";
import { buildDocumentPageContext } from "@/components/document-engine/page-manager/build-document-page-context";
import { useDocumentBodyHeight } from "@/components/document-engine/page-manager/use-document-body-height";
import { usePageManager } from "@/components/document-engine/page-manager/use-page-manager";
import { DocumentTemplatePage } from "@/components/document-engine/templates/document-template-page";
import type {
  DocumentTemplateContext,
  DocumentTemplateDefinition,
} from "@/components/document-engine/templates/types";
import { PrintPageStack } from "@/components/reports/print-document-layout";
import { cn } from "@/lib/utils";

export function DocumentPaginatedPages({
  template,
  baseContext,
}: {
  template: DocumentTemplateDefinition;
  baseContext: Omit<DocumentTemplateContext, "pageIndex" | "pageCount">;
}) {
  const editor = useDocumentEditorContext();
  const measureRef = useRef<HTMLDivElement>(null);
  const bodyHeightPx = useDocumentBodyHeight(measureRef);
  const { pages, pageCount, isEditorFocused } = usePageManager(editor, bodyHeightPx);

  return (
    <div className="document-paginated-stack relative">
      <PrintPageStack className="document-page-stack">
        {pages.map((page) => {
          const pageContext = buildDocumentPageContext(baseContext, page.index, pageCount);
          const isFirstPage = page.index === 0;

          return (
            <DocumentTemplatePage
              key={`document-page-${page.index}`}
              template={template}
              context={pageContext}
            >
              <div
                ref={isFirstPage ? measureRef : undefined}
                className="document-page-body-host relative min-h-0 flex-1"
                style={{ height: bodyHeightPx }}
              >
                <div
                  className={cn(
                    "document-page-static document-editor-content h-full overflow-hidden",
                    isFirstPage &&
                      isEditorFocused &&
                      "document-page-static--hidden-while-editing",
                    isFirstPage && !isEditorFocused && "cursor-text",
                  )}
                  dangerouslySetInnerHTML={{ __html: page.html }}
                  onMouseDown={
                    isFirstPage && !isEditorFocused
                      ? (event) => {
                          event.preventDefault();
                          editor?.commands.focus();
                        }
                      : undefined
                  }
                />
                {isFirstPage ? (
                  <div
                    className={cn(
                      "document-editor-overlay absolute inset-0 min-h-full overflow-auto",
                      !isEditorFocused && "pointer-events-none opacity-0",
                    )}
                  >
                    <DocumentBody />
                  </div>
                ) : null}
              </div>
            </DocumentTemplatePage>
          );
        })}
      </PrintPageStack>
    </div>
  );
}
