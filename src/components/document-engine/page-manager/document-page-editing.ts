import type { Editor } from "@tiptap/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

import type { DocumentPageSlice } from "@/components/document-engine/page-manager/page-manager";

export function getDocumentBlockStartPos(doc: ProseMirrorNode, blockIndex: number) {
  const clampedIndex = Math.max(0, Math.min(blockIndex, doc.childCount));
  let pos = 1;

  for (let index = 0; index < clampedIndex; index += 1) {
    pos += doc.child(index).nodeSize;
  }

  return pos;
}

export function getDocumentBlockIndexAtPos(doc: ProseMirrorNode, pos: number) {
  if (doc.childCount === 0) {
    return 0;
  }

  const clampedPos = Math.max(1, Math.min(pos, doc.content.size));
  const resolved = doc.resolve(clampedPos);
  return Math.min(resolved.index(0), doc.childCount - 1);
}

export function findPageIndexForBlockIndex(
  pages: DocumentPageSlice[],
  blockIndex: number,
) {
  if (pages.length === 0) {
    return 0;
  }

  const matchedIndex = pages.findIndex(
    (page) => blockIndex >= page.startBlockIndex && blockIndex < page.endBlockIndex,
  );

  if (matchedIndex >= 0) {
    return matchedIndex;
  }

  return pages.length - 1;
}

export function resolveDocumentPosForPageClick({
  editor,
  page,
  event,
}: {
  editor: Editor;
  page: DocumentPageSlice;
  event: Pick<MouseEvent, "target">;
}) {
  const doc = editor.state.doc;

  if (doc.childCount === 0) {
    return 1;
  }

  const pageRoot =
    event.target instanceof Element ? event.target.closest(".document-page-static") : null;
  const topLevelBlocks = pageRoot ? Array.from(pageRoot.children) : [];
  let blockOffset = 0;

  if (pageRoot && event.target instanceof Node) {
    const matchedIndex = topLevelBlocks.findIndex(
      (child) => child === event.target || child.contains(event.target as Node),
    );
    if (matchedIndex >= 0) {
      blockOffset = matchedIndex;
    }
  }

  const absoluteBlockIndex = Math.min(
    page.startBlockIndex + blockOffset,
    doc.childCount - 1,
  );
  const blockStartPos = getDocumentBlockStartPos(doc, absoluteBlockIndex);

  return Math.min(blockStartPos + 1, doc.content.size);
}

export function focusDocumentPageAtClick({
  editor,
  page,
  event,
}: {
  editor: Editor;
  page: DocumentPageSlice;
  event: Pick<MouseEvent, "target" | "preventDefault">;
}) {
  event.preventDefault();
  const selectionPos = resolveDocumentPosForPageClick({ editor, page, event });
  editor.chain().focus().setTextSelection(selectionPos).run();
  return selectionPos;
}
