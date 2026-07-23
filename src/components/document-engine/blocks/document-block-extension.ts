import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { DocumentBlockNodeView } from "@/components/document-engine/blocks/document-block-node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    documentBlock: {
      insertDocumentBlock: (blockId: string) => ReturnType;
    };
  }
}

export const DocumentBlockExtension = Node.create({
  name: "documentBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-block-id"),
        renderHTML: (attributes) => ({
          "data-block-id": attributes.blockId,
        }),
      },
      notesText: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-notes-text") ?? "",
        renderHTML: (attributes) => ({
          "data-notes-text": attributes.notesText,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="document-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "document-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentBlockNodeView);
  },

  addCommands() {
    return {
      insertDocumentBlock:
        (blockId: string) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { blockId, notesText: blockId === "notes" ? "" : undefined },
            })
            .run(),
    };
  },
});
