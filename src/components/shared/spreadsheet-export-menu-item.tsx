"use client";

import { Download } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function SpreadsheetExportMenuItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <DropdownMenuItem asChild>
      <a href={href} download className="flex items-center gap-2">
        <Download className="size-4" />
        {label}
      </a>
    </DropdownMenuItem>
  );
}
