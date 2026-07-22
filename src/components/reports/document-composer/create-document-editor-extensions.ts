import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import type { Extensions } from "@tiptap/core";

import { DOCUMENT_EDITOR_PLACEHOLDER } from "@/components/reports/document-composer/constants";
import { FontSize } from "@/components/reports/document-composer/extensions/font-size-extension";
import { Indent } from "@/components/reports/document-composer/extensions/indent-extension";

/**
 * Shared TipTap extension bundle for ERP document modules.
 * Add new extensions here so Blank Documents, Quotations, Invoices, etc. stay in sync.
 */
export function createDocumentEditorExtensions(options?: {
  placeholder?: string;
  extraExtensions?: Extensions;
}): Extensions {
  const placeholder = options?.placeholder ?? DOCUMENT_EDITOR_PLACEHOLDER;

  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
    }),
    TextAlign.configure({
      types: ["paragraph"],
    }),
    FontFamily,
    TextStyle,
    FontSize,
    Indent,
    Placeholder.configure({ placeholder }),
    ...(options?.extraExtensions ?? []),
  ];
}
