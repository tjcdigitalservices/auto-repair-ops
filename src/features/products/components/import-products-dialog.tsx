"use client";

import { useActionState, useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { FormStatusMessage } from "@/components/shared/form-status";
import { ModalDialog } from "@/components/shared/modal-dialog";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  importProductsFromFileAction,
} from "@/features/products/actions/product-import-actions";
import {
  INITIAL_PRODUCT_IMPORT_ACTION_STATE,
  type ProductImportActionState,
} from "@/features/products/import/product-import-action-state";
import {
  PRODUCT_IMPORT_MAX_FILE_BYTES,
  PRODUCT_IMPORT_MAX_ROWS,
  buildProductImportTemplateCsv,
} from "@/features/products/import/product-import-constants";

export function ImportProductsDialog({
  triggerVariant = "button",
}: {
  triggerVariant?: "button" | "menu";
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    if (!open) {
      setInstanceKey((current) => current + 1);
    }
  }, [open]);

  return (
    <ImportProductsDialogForm
      key={instanceKey}
      open={open}
      onOpenChange={setOpen}
      triggerVariant={triggerVariant}
    />
  );
}

function ImportProductsDialogForm({
  open,
  onOpenChange,
  triggerVariant = "button",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerVariant?: "button" | "menu";
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    importProductsFromFileAction,
    INITIAL_PRODUCT_IMPORT_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Import products"
      description="Upload a CSV or Excel file to create or update catalog products for this branch."
      trigger={({ openDialog }) =>
        triggerVariant === "menu" ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              openDialog();
            }}
            className="flex items-center gap-2"
          >
            <Upload className="size-4" />
            Import products
          </DropdownMenuItem>
        ) : (
          <Button type="button" variant="outline" onClick={openDialog}>
            <Upload className="size-4" />
            Import
          </Button>
        )
      }
    >
      {({ closeDialog }) => (
        <form action={formAction} className="space-y-5">
          {state.message ? (
            <div
              className={
                state.status === "success"
                  ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
                  : undefined
              }
            >
              {state.status === "success" ? (
                <p>{state.message}</p>
              ) : (
                <FormStatusMessage message={state.message} />
              )}
            </div>
          ) : null}

          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/15 px-4 py-4 text-sm text-muted-foreground">
            <p>
              Matching rows update an existing product when <strong>SKU</strong> or{" "}
              <strong>Barcode</strong> already exists on this branch. Missing
              categories, brands, units, and suppliers are created automatically.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Required column: Product Name</li>
              <li>Optional: Unit (defaults to Piece), prices, stock, supplier, and more</li>
              <li>
                Up to {PRODUCT_IMPORT_MAX_ROWS} rows /{" "}
                {PRODUCT_IMPORT_MAX_FILE_BYTES / (1024 * 1024)} MB
              </li>
            </ul>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={downloadTemplate}
            >
              <Download className="size-4" />
              Download CSV template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-import-file" required>
              Spreadsheet file
            </Label>
            <Input
              id="product-import-file"
              name="file"
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              required
            />
          </div>

          <ImportResultSummary state={state} />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Close
            </Button>
            <SubmitButton pendingLabel="Importing…">Import products</SubmitButton>
          </div>
        </form>
      )}
    </ModalDialog>
  );
}

function ImportResultSummary({ state }: { state: ProductImportActionState }) {
  if (state.status === "idle" || !state.errorSamples?.length) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Row issues</p>
      <ul className="space-y-1">
        {state.errorSamples.map((sample) => (
          <li key={`${sample.rowNumber}-${sample.message}`}>
            Row {sample.rowNumber}: {sample.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function downloadTemplate() {
  const blob = new Blob([buildProductImportTemplateCsv()], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "product-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
