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

import {
  FONT_FAMILIES,
  FONT_SIZES,
  type DocumentZoomMode,
} from "@/components/reports/document-composer/constants";
import { useDocumentEditorContext } from "@/components/reports/document-composer/document-editor-context";
import { DocumentZoom } from "@/components/reports/document-composer/document-zoom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function ToolbarSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 max-w-[7.5rem] shrink-0 rounded-md border border-border/80 bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
    >
      {options.map((option) => (
        <option key={option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function getActiveFontFamily(editor: Editor) {
  const attributes = editor.getAttributes("textStyle");

  return typeof attributes.fontFamily === "string" ? attributes.fontFamily : "";
}

function getActiveFontSize(editor: Editor) {
  const attributes = editor.getAttributes("textStyle");

  return typeof attributes.fontSize === "string" ? attributes.fontSize : "12pt";
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

      <ToolbarSelect
        label="Font family"
        value={getActiveFontFamily(editor)}
        onChange={(value) => {
          if (!value) {
            editor.chain().focus().unsetFontFamily().run();
            return;
          }

          editor.chain().focus().setFontFamily(value).run();
        }}
        options={FONT_FAMILIES}
      />
      <ToolbarSelect
        label="Font size"
        value={getActiveFontSize(editor)}
        onChange={(value) => {
          if (!value) {
            editor.chain().focus().unsetFontSize().run();
            return;
          }

          editor.chain().focus().setFontSize(value).run();
        }}
        options={FONT_SIZES}
      />

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

export function DocumentToolbar({
  className,
  zoomMode,
  onZoomChange,
}: {
  className?: string;
  zoomMode?: DocumentZoomMode;
  onZoomChange?: (value: DocumentZoomMode) => void;
}) {
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
        <>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <DocumentToolbarContent editor={editor} />
          </div>
          {zoomMode !== undefined && onZoomChange ? (
            <DocumentZoom value={zoomMode} onChange={onZoomChange} />
          ) : null}
        </>
      ) : (
        <div className="h-8 w-full animate-pulse rounded-md bg-muted/40" aria-hidden="true" />
      )}
    </div>
  );
}

/** @deprecated Use DocumentToolbar */
export const FormatToolbar = DocumentToolbar;
