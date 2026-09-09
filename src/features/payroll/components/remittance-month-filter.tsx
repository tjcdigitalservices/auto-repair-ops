"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Input } from "@/components/ui/input";

export function RemittanceMonthFilter({
  month,
  className,
}: {
  month: string;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Remittance month
      </span>
      <Input
        type="month"
        name="month"
        value={month}
        onChange={(event) => {
          const nextMonth = event.target.value;
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", "remittance");

          if (nextMonth) {
            params.set("month", nextMonth);
          } else {
            params.delete("month");
          }

          const query = params.toString();
          startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
          });
        }}
        className="w-full lg:w-[14rem]"
      />
    </label>
  );
}
