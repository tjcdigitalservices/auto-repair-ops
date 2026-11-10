import { describe, expect, it } from "vitest";
import { Fragment, Schema } from "@tiptap/pm/model";

import {
  findPageIndexForBlockIndex,
  getDocumentBlockIndexAtPos,
  getDocumentBlockStartPos,
} from "@/components/document-engine/page-manager/document-page-editing";
import type { DocumentPageSlice } from "@/components/document-engine/page-manager/page-manager";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      group: "block",
      content: "text*",
      toDOM() {
        return ["p", 0];
      },
    },
    text: { group: "inline" },
  },
});

function createDoc(paragraphs: string[]) {
  const nodes = paragraphs.map((text) =>
    schema.nodes.paragraph.create(null, text ? schema.text(text) : undefined),
  );
  return schema.nodes.doc.create(null, Fragment.from(nodes));
}

describe("document page editing helpers", () => {
  it("maps block indexes to document positions", () => {
    const doc = createDoc(["One", "Two", "Three"]);

    expect(getDocumentBlockStartPos(doc, 0)).toBe(1);
    expect(getDocumentBlockStartPos(doc, 1)).toBe(1 + doc.child(0).nodeSize);
    expect(getDocumentBlockIndexAtPos(doc, 2)).toBe(0);
    expect(getDocumentBlockIndexAtPos(doc, getDocumentBlockStartPos(doc, 2) + 1)).toBe(2);
  });

  it("finds the page that owns a block index", () => {
    const pages: DocumentPageSlice[] = [
      {
        index: 0,
        html: "<p>One</p><p>Two</p>",
        startBlockIndex: 0,
        endBlockIndex: 2,
        startOffsetPx: 0,
      },
      {
        index: 1,
        html: "<p>Three</p>",
        startBlockIndex: 2,
        endBlockIndex: 3,
        startOffsetPx: 120,
      },
    ];

    expect(findPageIndexForBlockIndex(pages, 0)).toBe(0);
    expect(findPageIndexForBlockIndex(pages, 1)).toBe(0);
    expect(findPageIndexForBlockIndex(pages, 2)).toBe(1);
    expect(findPageIndexForBlockIndex(pages, 9)).toBe(1);
  });
});
