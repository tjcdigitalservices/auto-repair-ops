"use client";

import { Printer } from "lucide-react";

import { PageHeaderActions } from "@/components/shared/page-header-actions";
import { Button } from "@/components/ui/button";

export function DocumentHeaderActions({
  onPrint,
  overflow,
}: {
  onPrint: () => void;
  overflow?: React.ReactNode;
}) {
  return (
    <PageHeaderActions
      primary={
        <Button type="button" variant="bluePrimary" onClick={onPrint}>
          <Printer className="size-4" />
          Print
        </Button>
      }
      overflow={overflow}
    />
  );
}

/** @deprecated Use DocumentHeaderActions */
export const DocumentActions = DocumentHeaderActions;
