import { describe, expect, it } from "vitest";

import { resolveJobOrderPrintHidePrices } from "@/features/job-orders/print-utils";

describe("resolveJobOrderPrintHidePrices", () => {
  it("defaults to the workshop copy without prices", () => {
    expect(resolveJobOrderPrintHidePrices()).toBe(true);
    expect(resolveJobOrderPrintHidePrices({})).toBe(true);
  });

  it("shows prices when showPrices is enabled", () => {
    expect(resolveJobOrderPrintHidePrices({ showPrices: "1" })).toBe(false);
  });

  it("supports legacy hidePrices query params", () => {
    expect(resolveJobOrderPrintHidePrices({ hidePrices: "1" })).toBe(true);
    expect(resolveJobOrderPrintHidePrices({ hidePrices: "0" })).toBe(false);
  });
});
