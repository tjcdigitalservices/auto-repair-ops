"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";

import { useDocumentEditorContext } from "@/components/document-engine/hooks/document-editor-context";
import { DocumentInsertMenu } from "@/components/document-engine/insert/document-insert-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BlockType = "paragraph" | "heading2" | "heading3";

const BLOCK_TYPE_OPTIONS: Array<{ label: string; value: BlockType }> = [
  { label: "Paragraph", value: "paragraph" },
  { label: "Heading", value: "heading2" },
  { label: "Subheading", value: "heading3" },
];

function ToolbarDivider() {
  return <div className="mx-0.5 hidden h-6 w-px shrink-0 bg-border/80 sm:block" aria-hidden="true" />;
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className={cn("size-8 shrink-0", active && "bg-muted text-foreground")}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

function getActiveBlockType(editor: Editor): BlockType {
  if (editor.isActive("heading", { level: 2 })) {
    return "heading2";
  }

  if (editor.isActive("heading", { level: 3 })) {
    return "heading3";
  }

  return "paragraph";
}

function setBlockType(editor: Editor, blockType: BlockType) {
  if (blockType === "paragraph") {
    editor.chain().focus().setParagraph().run();
    return;
  }

  if (blockType === "heading2") {
    editor.chain().focus().toggleHeading({ level: 2 }).run();
    return;
  }

  editor.chain().focus().toggleHeading({ level: 3 }).run();
}

function handleIndent(editor: Editor) {
  if (editor.can().sinkListItem("listItem")) {
    editor.chain().focus().sinkListItem("listItem").run();
    return;
  }

  editor.chain().focus().indent().run();
}

function handleOutdent(editor: Editor) {
  if (editor.can().liftListItem("listItem")) {
    editor.chain().focus().liftListItem("listItem").run();
    return;
  }

  editor.chain().focus().outdent().run();
}

function DocumentToolbarContent({ editor }: { editor: Editor }) {
  return (
    <>
      <ToolbarButton
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <DocumentInsertMenu editor={editor} />

      <ToolbarDivider />

      <select
        aria-label="Text style"
        value={getActiveBlockType(editor)}
        onChange={(event) => setBlockType(editor, event.target.value as BlockType)}
        className="h-8 max-w-[8.5rem] shrink-0 rounded-md border border-border/80 bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
      >
        {BLOCK_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ToolbarDivider />

      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Justify"
        active={editor.isActive({ textAlign: "justify" })}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Increase indent" onClick={() => handleIndent(editor)}>
        <IndentIncrease className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Decrease indent" onClick={() => handleOutdent(editor)}>
        <IndentDecrease className="size-4" />
      </ToolbarButton>
    </>
  );
}

/** Formatting controls only — document actions belong in the page header. */
export function DocumentToolbar({ className }: { className?: string }) {
  const editor = useDocumentEditorContext();

  return (
    <div
      className={cn(
        "document-composer-chrome no-print sticky top-0 z-20 flex shrink-0 flex-wrap items-center gap-1 border-b border-border/70 bg-background/95 px-3 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/85",
        className,
      )}
      role="toolbar"
      aria-label="Formatting"
    >
      {editor ? (
        <DocumentToolbarContent editor={editor} />
      ) : (
        <div className="h-8 w-full animate-pulse rounded-md bg-muted/40" aria-hidden="true" />
      )}
    </div>
  );
}

/** @deprecated Use DocumentToolbar */
export const FormatToolbar = DocumentToolbar;
