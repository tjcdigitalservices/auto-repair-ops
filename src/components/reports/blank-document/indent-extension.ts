import { Extension } from "@tiptap/core";

const INDENT_STEP_PX = 24;
const MAX_INDENT_LEVEL = 8;
const INDENT_NODE_TYPES = ["paragraph", "heading", "listItem"];

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

function getIndentLevel(node: { attrs: { indent?: number } }) {
  return typeof node.attrs.indent === "number" ? node.attrs.indent : 0;
}

export const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: INDENT_NODE_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const marginLeft = element.style.marginLeft;

              if (!marginLeft) {
                return 0;
              }

              const pixels = Number.parseInt(marginLeft, 10);

              if (Number.isNaN(pixels)) {
                return 0;
              }

              return Math.round(pixels / INDENT_STEP_PX);
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) {
                return {};
              }

              return {
                style: `margin-left: ${attributes.indent * INDENT_STEP_PX}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let updated = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!INDENT_NODE_TYPES.includes(node.type.name)) {
              return;
            }

            const nextIndent = Math.min(getIndentLevel(node) + 1, MAX_INDENT_LEVEL);

            if (nextIndent === getIndentLevel(node)) {
              return;
            }

            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: nextIndent,
            });
            updated = true;
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let updated = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!INDENT_NODE_TYPES.includes(node.type.name)) {
              return;
            }

            const nextIndent = Math.max(getIndentLevel(node) - 1, 0);

            if (nextIndent === getIndentLevel(node)) {
              return;
            }

            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: nextIndent,
            });
            updated = true;
          });

          if (updated && dispatch) {
            dispatch(tr);
          }

          return updated;
        },
    };
  },
});
