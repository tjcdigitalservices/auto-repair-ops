"use client";

import type { Editor } from "@tiptap/react";
import { Plus } from "lucide-react";

import {
  listInsertMenuItems,
  type InsertMenuAction,
  type InsertMenuGroup,
  type InsertMenuItem,
} from "@/components/document-engine/insert/registry";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function InsertMenuActionItem({
  item,
  editor,
}: {
  item: InsertMenuAction;
  editor: Editor;
}) {
  const Icon = item.icon;

  return (
    <DropdownMenuItem
      onSelect={() => {
        item.run(editor);
      }}
    >
      {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      {item.label}
    </DropdownMenuItem>
  );
}

function InsertMenuGroupItem({
  item,
  editor,
}: {
  item: InsertMenuGroup;
  editor: Editor;
}) {
  const Icon = item.icon;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        {item.label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <InsertMenuGroupContents items={item.items} editor={editor} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function InsertMenuNode({ item, editor }: { item: InsertMenuItem; editor: Editor }) {
  if (item.type === "group") {
    return <InsertMenuGroupItem item={item} editor={editor} />;
  }

  return <InsertMenuActionItem item={item} editor={editor} />;
}

function InsertMenuGroupContents({
  items,
  editor,
}: {
  items: InsertMenuItem[];
  editor: Editor;
}) {
  return items.map((item) => <InsertMenuNode key={item.id} item={item} editor={editor} />);
}

export function DocumentInsertMenu({ editor }: { editor: Editor }) {
  const items = listInsertMenuItems();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs">
          <Plus className="size-4" />
          Insert
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <InsertMenuGroupContents items={items} editor={editor} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
