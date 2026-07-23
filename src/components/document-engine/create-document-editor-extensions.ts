import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import type { Extensions } from "@tiptap/core";

import { DOCUMENT_EDITOR_PLACEHOLDER } from "@/components/document-engine/constants";
import { DocumentBlockExtension } from "@/components/document-engine/blocks/document-block-extension";
import { FontSize } from "@/components/document-engine/extensions/font-size-extension";
import { Indent } from "@/components/document-engine/extensions/indent-extension";
import { MergeVariableExtension } from "@/components/document-engine/variables/merge-variable-extension";

/**
 * Shared TipTap extension bundle for ERP document modules.
 */
export function createDocumentEditorExtensions(options?: {
  placeholder?: string;
  extraExtensions?: Extensions;
}): Extensions {
  const placeholder = options?.placeholder ?? DOCUMENT_EDITOR_PLACEHOLDER;

  return [
    StarterKit.configure({
      heading: {
        levels: [2, 3],
      },
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
    }),
    TextAlign.configure({
      types: ["paragraph", "heading"],
    }),
    FontFamily,
    TextStyle,
    FontSize,
    Indent,
    DocumentBlockExtension,
    MergeVariableExtension,
    Placeholder.configure({ placeholder }),
    ...(options?.extraExtensions ?? []),
  ];
}
