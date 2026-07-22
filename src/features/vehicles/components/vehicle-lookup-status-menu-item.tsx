"use client";

import { Power } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { TableRowActionIconName } from "@/components/shared/table-row-actions-menu";
import { cn } from "@/lib/utils";

const TABLE_ROW_ACTION_ICONS = {
  power: Power,
} as const;

function RowActionIcon({
  iconName,
  className = "size-4",
}: {
  iconName?: TableRowActionIconName;
  className?: string;
}) {
  const Icon = iconName ? TABLE_ROW_ACTION_ICONS[iconName as keyof typeof TABLE_ROW_ACTION_ICONS] : undefined;

  return Icon ? <Icon className={className} /> : null;
}

export function LookupStatusFormMenuItem({
  label,
  action,
  fields,
  tone = "default",
  iconName = "power",
}: {
  label: string;
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  tone?: "default" | "destructive";
  iconName?: TableRowActionIconName;
}) {
  return (
    <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
      <form action={action}>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="submit"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors hover:bg-muted/70 focus:bg-muted/70",
            tone === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
          )}
        >
          <RowActionIcon iconName={iconName} />
          <span>{label}</span>
        </button>
      </form>
    </DropdownMenuItem>
  );
}
