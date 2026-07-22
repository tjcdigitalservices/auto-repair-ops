"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageTabs } from "@/components/shared/page-tabs";

export type PayrollPageTab = "periods" | "compensation";

export function PayrollTabNav({
  periodCount,
  compensationCount,
}: {
  periodCount: number;
  compensationCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: PayrollPageTab =
    searchParams.get("tab") === "compensation" ? "compensation" : "periods";

  function setTab(nextTab: PayrollPageTab) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "periods") {
      params.delete("tab");
    } else {
      params.set("tab", "compensation");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <PageTabs
      activeTab={activeTab}
      onTabChange={(tabId) => setTab(tabId as PayrollPageTab)}
      tabs={[
        { id: "periods", label: "Payroll Periods", count: periodCount },
        { id: "compensation", label: "Compensation Setup", count: compensationCount },
      ]}
    />
  );
}
