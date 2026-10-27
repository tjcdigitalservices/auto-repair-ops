import { InventoryPageView } from "@/features/inventory/components/inventory-page-view";
import { getInventoryDashboardData } from "@/features/inventory/queries/inventory-queries";
import type {
  InventoryMovementType,
  InventoryStockFilterState,
} from "@/features/inventory/types";

export const dynamic = "force-dynamic";

type InventoryPageProps = {
  searchParams: Promise<{
    search?: string;
    stockState?: InventoryStockFilterState;
    movementType?: InventoryMovementType;
    tab?: "movements";
    stockPage?: string;
    movementPage?: string;
    pageSize?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const {
    search = "",
    stockState = "all",
    movementType = "",
    tab,
    stockPage,
    movementPage,
    pageSize,
  } = await searchParams;
  const activeTab = tab === "movements" ? "movements" : "inventory";
  const inventory = await getInventoryDashboardData({
    search,
    stockState: activeTab === "inventory" ? stockState : "all",
    movementType: activeTab === "movements" ? movementType : "",
  });

  return (
    <InventoryPageView
      inventory={inventory}
      search={search}
      stockState={stockState}
      movementType={movementType}
      activeTab={activeTab}
      stockPage={stockPage}
      movementPage={movementPage}
      pageSize={pageSize}
    />
  );
}
