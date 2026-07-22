"use client";

import Link from "next/link";
import { Package } from "lucide-react";

import { PageOverflowMenu } from "@/components/shared/page-header-actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { InventorySettingsDialog } from "@/features/inventory/components/inventory-settings-dialog";
import type { InventoryProductOption } from "@/features/inventory/types";

export function InventoryPageActionsMenu({
  products,
}: {
  products: InventoryProductOption[];
}) {
  return (
    <PageOverflowMenu label="More inventory actions">
      <InventorySettingsDialog products={products} triggerVariant="menu" />
      <DropdownMenuItem asChild>
        <Link href="/products" className="flex items-center gap-2">
          <Package className="size-4" />
          Review Products
        </Link>
      </DropdownMenuItem>
    </PageOverflowMenu>
  );
}
