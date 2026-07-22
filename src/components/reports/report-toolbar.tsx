"use client";

import { Download, Printer } from "lucide-react";

import { ActionDropdown } from "@/components/shared/action-dropdown";
import { Button } from "@/components/ui/button";

export function ReportToolbar({
  downloadHref,
  alternatePrintHref,
  showingAlternatePrint = false,
  primaryPrintLabel = "Print",
  alternatePrintLabel = "Print without prices",
}: {
  downloadHref?: string;
  alternatePrintHref?: string;
  showingAlternatePrint?: boolean;
  primaryPrintLabel?: string;
  alternatePrintLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      {alternatePrintHref ? (
        <ActionDropdown
          label="Print"
          variant="outlineBlue"
          size="sm"
          items={[
            showingAlternatePrint
              ? {
                  label: alternatePrintLabel,
                  href: `${alternatePrintHref}${alternatePrintHref.includes("?") ? "&" : "?"}autoprint=1`,
                }
              : {
                  label: primaryPrintLabel,
                  onSelect: () => window.print(),
                },
            showingAlternatePrint
              ? {
                  label: primaryPrintLabel,
                  onSelect: () => window.print(),
                }
              : {
                  label: alternatePrintLabel,
                  href: `${alternatePrintHref}${alternatePrintHref.includes("?") ? "&" : "?"}autoprint=1`,
                },
          ]}
        />
      ) : (
        <Button type="button" variant="outlineBlue" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          {primaryPrintLabel}
        </Button>
      )}
      {downloadHref ? (
        <Button asChild type="button" variant="bluePrimary" size="sm">
          <a href={downloadHref}>
            <Download className="size-4" />
            Download PDF
          </a>
        </Button>
      ) : null}
    </div>
  );
}
