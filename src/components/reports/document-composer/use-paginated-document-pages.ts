"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useLayoutEffect, useState } from "react";

import { paginateDocumentHtml } from "@/components/reports/document-composer/paginate-document-html";

export function usePaginatedDocumentPages(
  editor: Editor | null,
  bodyHeightPx: number,
) {
  const [pages, setPages] = useState<string[]>(() => ["<p><br></p>"]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const repaginate = useCallback(
    (html: string) => {
      const nextPages = paginateDocumentHtml(html, bodyHeightPx);
      setPages(nextPages);
      setActivePageIndex((current) => Math.min(current, Math.max(nextPages.length - 1, 0)));
      return nextPages;
    },
    [bodyHeightPx],
  );

  useLayoutEffect(() => {
    if (!editor || bodyHeightPx <= 0) {
      return;
    }

    function syncPages() {
      repaginate(editor!.getHTML());
    }

    syncPages();
    editor.on("update", syncPages);

    return () => {
      editor.off("update", syncPages);
    };
  }, [bodyHeightPx, editor, repaginate]);

  return {
    pages,
    activePageIndex,
    setActivePageIndex,
    repaginate,
  };
}
