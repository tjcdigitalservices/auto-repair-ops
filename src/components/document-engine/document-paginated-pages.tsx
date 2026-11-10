"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { DocumentBody } from "@/components/document-engine/document-body";
import { useDocumentEditorContext } from "@/components/document-engine/hooks/document-editor-context";
import { buildDocumentPageContext } from "@/components/document-engine/page-manager/build-document-page-context";
import {
  findPageIndexForBlockIndex,
  focusDocumentPageAtClick,
  getDocumentBlockIndexAtPos,
} from "@/components/document-engine/page-manager/document-page-editing";
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
  const { bodyHeightPx, contentWidthPx } = useDocumentBodyHeight(measureRef);
  const { pages, pageCount, isEditorFocused } = usePageManager(
    editor,
    bodyHeightPx,
    contentWidthPx,
  );
  const [activePageIndex, setActivePageIndex] = useState(0);
  const activePage = pages[activePageIndex] ?? pages[0];

  useEffect(() => {
    if (!editor) {
      return;
    }

    function syncActivePageFromSelection() {
      if (!editor) {
        return;
      }

      const blockIndex = getDocumentBlockIndexAtPos(
        editor.state.doc,
        editor.state.selection.from,
      );
      const nextPageIndex = findPageIndexForBlockIndex(pages, blockIndex);

      setActivePageIndex((current) =>
        current === nextPageIndex ? current : nextPageIndex,
      );
    }

    syncActivePageFromSelection();
    editor.on("selectionUpdate", syncActivePageFromSelection);
    editor.on("update", syncActivePageFromSelection);

    return () => {
      editor.off("selectionUpdate", syncActivePageFromSelection);
      editor.off("update", syncActivePageFromSelection);
    };
  }, [editor, pages]);

  useLayoutEffect(() => {
    if (!editor || editor.isDestroyed || !isEditorFocused) {
      return;
    }

    // Remounting the overlay onto another page can drop DOM focus; restore it.
    if (!editor.view.hasFocus()) {
      editor.commands.focus();
    }
  }, [activePageIndex, editor, isEditorFocused]);

  useEffect(() => {
    if (activePageIndex > pages.length - 1) {
      setActivePageIndex(Math.max(pages.length - 1, 0));
    }
  }, [activePageIndex, pages.length]);

  return (
    <div className="document-paginated-stack relative">
      <PrintPageStack className="document-page-stack">
        {pages.map((page) => {
          const pageContext = buildDocumentPageContext(baseContext, page.index, pageCount);
          const isFirstPage = page.index === 0;
          const isActivePage = page.index === activePageIndex;
          const showEditorOverlay = isActivePage;
          const hideStaticWhileEditing = isActivePage && isEditorFocused;

          return (
            <DocumentTemplatePage
              key={`document-page-${page.index}`}
              template={template}
              context={pageContext}
            >
              <div
                ref={isFirstPage ? measureRef : undefined}
                className="document-page-body-host relative min-h-0 flex-1 overflow-hidden"
                style={{ height: "100%", maxHeight: bodyHeightPx }}
              >
                <div
                  className={cn(
                    "document-page-static document-editor-content h-full overflow-hidden",
                    hideStaticWhileEditing && "document-page-static--hidden-while-editing",
                    !hideStaticWhileEditing && "cursor-text",
                  )}
                  dangerouslySetInnerHTML={{ __html: page.html }}
                  onMouseDown={
                    hideStaticWhileEditing
                      ? undefined
                      : (event) => {
                          if (!editor) {
                            return;
                          }

                          focusDocumentPageAtClick({ editor, page, event });
                          setActivePageIndex(page.index);
                        }
                  }
                />
                {showEditorOverlay ? (
                  <div
                    className={cn(
                      "document-editor-overlay absolute inset-0 overflow-hidden",
                      !isEditorFocused && "pointer-events-none opacity-0",
                    )}
                  >
                    <div
                      className="document-editor-overlay-offset"
                      style={{
                        transform: `translateY(-${activePage?.startOffsetPx ?? 0}px)`,
                      }}
                    >
                      <DocumentBody />
                    </div>
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
