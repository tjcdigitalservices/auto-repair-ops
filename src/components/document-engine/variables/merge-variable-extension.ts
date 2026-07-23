import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { MergeVariableNodeView } from "@/components/document-engine/variables/merge-variable-node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mergeVariable: {
      insertMergeVariable: (variableId: string) => ReturnType;
    };
  }
}

export const MergeVariableExtension = Node.create({
  name: "mergeVariable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      variableId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variable-id"),
        renderHTML: (attributes) => ({
          "data-variable-id": attributes.variableId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="merge-variable"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "merge-variable" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MergeVariableNodeView);
  },

  addCommands() {
    return {
      insertMergeVariable:
        (variableId: string) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { variableId },
            })
            .run(),
    };
  },
});
