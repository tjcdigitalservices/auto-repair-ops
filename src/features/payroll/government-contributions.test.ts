import { describe, expect, it } from "vitest";

import {
  governmentContributionEntries,
  isReservedGovernmentAdjustmentLabel,
  resolveGovernmentContributions,
} from "@/features/payroll/government-contributions";

describe("resolveGovernmentContributions", () => {
  const shopDefaults = {
    sssAmount: 450,
    philhealthAmount: 400,
    pagibigAmount: 100,
  };

  it("uses shop defaults when profile is missing", () => {
    expect(
      resolveGovernmentContributions({
        shopDefaults,
        profile: null,
      }),
    ).toEqual(shopDefaults);
  });

  it("uses shop defaults when the profile opts in", () => {
    expect(
      resolveGovernmentContributions({
        shopDefaults,
        profile: {
          useShopDefaultContributions: true,
          sssAmount: 10,
          philhealthAmount: 20,
          pagibigAmount: 30,
        },
      }),
    ).toEqual(shopDefaults);
  });

  it("uses profile overrides when shop defaults are turned off", () => {
    expect(
      resolveGovernmentContributions({
        shopDefaults,
        profile: {
          useShopDefaultContributions: false,
          sssAmount: 200,
          philhealthAmount: 150,
          pagibigAmount: 50,
        },
      }),
    ).toEqual({
      sssAmount: 200,
      philhealthAmount: 150,
      pagibigAmount: 50,
    });
  });

  it("treats null override amounts as zero", () => {
    expect(
      resolveGovernmentContributions({
        shopDefaults,
        profile: {
          useShopDefaultContributions: false,
          sssAmount: null,
          philhealthAmount: null,
          pagibigAmount: null,
        },
      }),
    ).toEqual({
      sssAmount: 0,
      philhealthAmount: 0,
      pagibigAmount: 0,
    });
  });
});

describe("governmentContributionEntries", () => {
  it("omits zero-amount contributions", () => {
    expect(
      governmentContributionEntries({
        sssAmount: 450,
        philhealthAmount: 0,
        pagibigAmount: 100,
      }),
    ).toEqual([
      { key: "sss", label: "SSS", amount: 450 },
      { key: "pagibig", label: "Pag-IBIG", amount: 100 },
    ]);
  });
});

describe("isReservedGovernmentAdjustmentLabel", () => {
  it("blocks reserved government labels", () => {
    expect(isReservedGovernmentAdjustmentLabel("SSS")).toBe(true);
    expect(isReservedGovernmentAdjustmentLabel("philhealth")).toBe(true);
    expect(isReservedGovernmentAdjustmentLabel("Pag-IBIG")).toBe(true);
    expect(isReservedGovernmentAdjustmentLabel("Pag IBIG")).toBe(true);
    expect(isReservedGovernmentAdjustmentLabel("Bonus")).toBe(false);
  });
});
