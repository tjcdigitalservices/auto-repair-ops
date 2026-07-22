"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { Button } from "@/components/ui/button";
import { InventorySettingsForm } from "@/features/inventory/components/inventory-settings-form";
import type { InventoryProductOption } from "@/features/inventory/types";
import { SlidersHorizontal } from "lucide-react";

export function InventorySettingsDialog({
  products,
  triggerVariant = "button",
}: {
  products: InventoryProductOption[];
  triggerVariant?: "button" | "menu";
}) {
  return (
    <ModalDialog
      title="Stock settings"
      description="Manage branch-level reorder thresholds and shelf location without editing the product catalog."
      size="lg"
      trigger={({ openDialog }) =>
        triggerVariant === "menu" ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              openDialog();
            }}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Stock settings
          </DropdownMenuItem>
        ) : (
          <Button type="button" variant="outline" onClick={openDialog}>
            <SlidersHorizontal className="mr-2 size-4" />
            Stock settings
          </Button>
        )
      }
    >
      {() => <InventorySettingsForm products={products} />}
    </ModalDialog>
  );
}
