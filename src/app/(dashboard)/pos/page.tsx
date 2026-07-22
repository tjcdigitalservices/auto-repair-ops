import Link from "next/link";

import { BranchSelector } from "@/components/shared/branch-selector";
import { buttonVariants } from "@/components/ui/button";
import { PosTerminal } from "@/features/pos/components/pos-terminal";
import { getPosTerminalData } from "@/features/pos/queries/pos-queries";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [terminal, branchSelector] = await Promise.all([
    getPosTerminalData(),
    getBranchScope().then(getPageBranchSelectorProps),
  ]);

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Point of Sale</h1>
          <p className="text-sm text-muted-foreground">
            {terminal.config.showBranchContext
              ? `Fast retail checkout for ${terminal.config.branchName}.`
              : "Fast retail checkout for walk-in and counter sales."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BranchSelector {...branchSelector} className="w-[12rem]" />
          <Link href="/invoices" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Recent invoices
          </Link>
        </div>
      </div>

      <PosTerminal terminal={terminal} />
    </div>
  );
}
