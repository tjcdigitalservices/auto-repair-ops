import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import { Blocks, Braces, ImageIcon, Minus, PenLine } from "lucide-react";

import { listInsertableDocumentBlocks } from "@/components/document-engine/blocks/registry";
import { listMergeVariableGroups } from "@/components/document-engine/variables/registry";

export type InsertMenuAction = {
  type: "action";
  id: string;
  label: string;
  icon?: LucideIcon;
  run: (editor: Editor) => void;
};

export type InsertMenuGroup = {
  type: "group";
  id: string;
  label: string;
  icon?: LucideIcon;
  items: InsertMenuItem[];
};

export type InsertMenuItem = InsertMenuAction | InsertMenuGroup;

const insertMenuRegistry: InsertMenuItem[] = [];

export function registerInsertMenuItem(item: InsertMenuItem, position: "start" | "end" = "end") {
  if (position === "start") {
    insertMenuRegistry.unshift(item);
    return;
  }

  insertMenuRegistry.push(item);
}

export function listInsertMenuItems() {
  return insertMenuRegistry;
}

export function registerDefaultInsertMenuItems() {
  if (insertMenuRegistry.length > 0) {
    return;
  }

  registerInsertMenuItem({
    type: "group",
    id: "blocks",
    label: "Block",
    icon: Blocks,
    items: listInsertableDocumentBlocks().map((block) => ({
      type: "action",
      id: `block:${block.id}`,
      label: block.label,
      icon: block.icon,
      run: (editor) => {
        editor.chain().focus().insertDocumentBlock(block.id).run();
      },
    })),
  });

  registerInsertMenuItem({
    type: "group",
    id: "variables",
    label: "Variable",
    icon: Braces,
    items: listMergeVariableGroups().map(({ group, variables }) => ({
      type: "group" as const,
      id: `variable-group:${group.toLowerCase().replace(/\s+/g, "-")}`,
      label: group,
      items: variables.map((variable) => ({
        type: "action" as const,
        id: `variable:${variable.id}`,
        label: variable.label,
        run: (editor: Editor) => {
          editor.chain().focus().insertMergeVariable(variable.id).run();
        },
      })),
    })),
  });

  registerInsertMenuItem({
    type: "action",
    id: "divider",
    label: "Divider",
    icon: Minus,
    run: (editor) => {
      editor.chain().focus().insertDocumentBlock("divider").run();
    },
  });

  registerInsertMenuItem({
    type: "action",
    id: "image-placeholder",
    label: "Image Placeholder",
    icon: ImageIcon,
    run: (editor) => {
      editor.chain().focus().insertDocumentBlock("image-placeholder").run();
    },
  });

  registerInsertMenuItem({
    type: "action",
    id: "signature",
    label: "Signature",
    icon: PenLine,
    run: (editor) => {
      editor.chain().focus().insertDocumentBlock("signature").run();
    },
  });
}

registerDefaultInsertMenuItems();
