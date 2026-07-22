"use client";

import { createContext, useContext } from "react";
import type { Editor } from "@tiptap/react";

const DocumentEditorContext = createContext<Editor | null>(null);

export function DocumentEditorProvider({
  editor,
  children,
}: {
  editor: Editor | null;
  children: React.ReactNode;
}) {
  return (
    <DocumentEditorContext.Provider value={editor}>{children}</DocumentEditorContext.Provider>
  );
}

export function useDocumentEditorContext() {
  return useContext(DocumentEditorContext);
}
