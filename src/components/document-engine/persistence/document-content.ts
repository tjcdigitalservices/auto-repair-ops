import type { JSONContent } from "@tiptap/core";

/** Minimal valid empty TipTap document. */
export const EMPTY_DOCUMENT_JSON: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function createDefaultDocumentJson(text: string): JSONContent {
  const trimmed = text.trim();

  if (!trimmed) {
    return EMPTY_DOCUMENT_JSON;
  }

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: trimmed }],
      },
    ],
  };
}

export function isDocumentJson(value: unknown): value is JSONContent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as JSONContent).type === "doc"
  );
}

export function normalizeDocumentJson(value: unknown, fallbackText = ""): JSONContent {
  if (isDocumentJson(value)) {
    return value;
  }

  return createDefaultDocumentJson(fallbackText);
}
