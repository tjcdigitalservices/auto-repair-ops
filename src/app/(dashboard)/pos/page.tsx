import { PosPageView } from "@/features/pos/components/pos-page-view";
import { getPosTerminalData } from "@/features/pos/queries/pos-queries";
import { getBranchScope, getPageBranchSelectorProps } from "@/lib/branches";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [terminal, branchSelector] = await Promise.all([
    getPosTerminalData(),
    getBranchScope().then(getPageBranchSelectorProps),
  ]);

  return <PosPageView terminal={terminal} branchSelector={branchSelector} />;
}
