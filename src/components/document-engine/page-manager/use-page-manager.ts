"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  createPageManager,
  type PageManagerSnapshot,
} from "@/components/document-engine/page-manager/page-manager";
import type { PaginateDocumentHtmlOptions } from "@/components/document-engine/page-manager/paginate-document-html";

export function usePageManager(
  editor: Editor | null,
  bodyHeightPx: number,
  contentWidthPx?: number,
) {
  const pageManagerRef = useRef(createPageManager());
  const [snapshot, setSnapshot] = useState<PageManagerSnapshot>(() =>
    pageManagerRef.current.getSnapshot(),
  );
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  const paginationOptions = useMemo<PaginateDocumentHtmlOptions>(
    () => ({
      maxHeightPx: bodyHeightPx,
      contentWidthPx,
    }),
    [bodyHeightPx, contentWidthPx],
  );

  const repaginate = useCallback(
    (html: string) => {
      if (bodyHeightPx <= 0) {
        return pageManagerRef.current.getSnapshot();
      }

      const nextSnapshot = pageManagerRef.current.paginate(html, paginationOptions);
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    },
    [bodyHeightPx, paginationOptions],
  );

  useLayoutEffect(() => {
    if (!editor || bodyHeightPx <= 0) {
      return;
    }

    function syncPages() {
      repaginate(editor!.getHTML());
    }

    function handleFocus() {
      setIsEditorFocused(true);
    }

    function handleBlur() {
      setIsEditorFocused(false);
    }

    syncPages();
    editor.on("update", syncPages);
    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);

    return () => {
      editor.off("update", syncPages);
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [bodyHeightPx, editor, repaginate]);

  return {
    pages: snapshot.pages,
    pageCount: snapshot.pageCount,
    isEditorFocused,
    repaginate,
  };
}
