"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageTabs } from "@/components/shared/page-tabs";

export function InventoryTabNav({
  stockCount,
  movementCount,
}: {
  stockCount: number;
  movementCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "movements" ? "movements" : "inventory";

  function setTab(nextTab: "inventory" | "movements") {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "inventory") {
      params.delete("tab");
    } else {
      params.set("tab", "movements");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <PageTabs
      activeTab={activeTab}
      onTabChange={(tabId) => setTab(tabId as "inventory" | "movements")}
      tabs={[
        { id: "inventory", label: "Inventory", count: stockCount },
        { id: "movements", label: "Stock movements", count: movementCount },
      ]}
    />
  );
}
