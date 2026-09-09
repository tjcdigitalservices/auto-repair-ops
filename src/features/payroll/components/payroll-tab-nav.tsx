"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageTabs } from "@/components/shared/page-tabs";

export type PayrollPageTab = "periods" | "compensation" | "remittance";

export function PayrollTabNav({
  periodCount,
  compensationCount,
  remittanceEmployeeCount,
}: {
  periodCount: number;
  compensationCount: number;
  remittanceEmployeeCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: PayrollPageTab =
    tabParam === "compensation"
      ? "compensation"
      : tabParam === "remittance"
        ? "remittance"
        : "periods";

  function setTab(nextTab: PayrollPageTab) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "periods") {
      params.delete("tab");
      params.delete("month");
    } else if (nextTab === "compensation") {
      params.set("tab", "compensation");
      params.delete("month");
    } else {
      params.set("tab", "remittance");
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
        {
          id: "remittance",
          label: "Remittance",
          count: remittanceEmployeeCount,
        },
      ]}
    />
  );
}
