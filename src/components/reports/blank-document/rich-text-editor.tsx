"use client";

import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { DEFAULT_DOCUMENT_BODY_HTML } from "@/components/reports/blank-document/constants";
import { FontSize } from "@/components/reports/blank-document/font-size-extension";
import { FormatToolbar } from "@/components/reports/blank-document/format-toolbar";
import { Indent } from "@/components/reports/blank-document/indent-extension";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  content,
  onChange,
  className,
}: {
  content: string;
  onChange: (html: string) => void;
  className?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
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
      Placeholder.configure({
        placeholder: "Start writing your document…",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        id: "blank-document-body",
        "aria-label": "Document Body",
        class: cn(
          "blank-document-editor-content min-h-[220px] px-3 py-3 text-sm leading-relaxed outline-none",
          "focus:outline-none",
        ),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}>
      <FormatToolbar editor={editor} />
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/80 bg-background">
        <EditorContent
          editor={editor}
          className="h-full [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none"
        />
      </div>
    </div>
  );
}
