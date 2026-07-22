"use client";

import { Download, FileOutput, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DocumentActionToolbar({
  onPrint,
  actions,
}: {
  onPrint: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 px-4 py-3"
      role="toolbar"
      aria-label="Document actions"
    >
      <Button type="button" variant="bluePrimary" size="sm" onClick={onPrint}>
        <Printer className="size-4" />
        Print
      </Button>
      <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
        <FileOutput className="size-4" />
        Export PDF
      </Button>
      <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
        <Download className="size-4" />
        Download PDF
      </Button>
      {actions}
    </div>
  );
}
