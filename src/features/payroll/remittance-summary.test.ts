import { describe, expect, it } from "vitest";

import {
  buildRemittanceEmployeeRows,
  periodOverlapsRemittanceMonth,
  resolveRemittanceMonth,
  summarizeRemittanceRows,
} from "@/features/payroll/remittance-summary";

describe("resolveRemittanceMonth", () => {
  it("parses a valid yyyy-MM month", () => {
    expect(resolveRemittanceMonth("2026-03")).toEqual({
      month: "2026-03",
      monthLabel: "March 2026",
      monthStartDate: "2026-03-01",
      monthEndDate: "2026-03-31",
    });
  });

  it("falls back for invalid month values", () => {
    const resolved = resolveRemittanceMonth("not-a-month");
    expect(resolved.month).toMatch(/^\d{4}-\d{2}$/);
    expect(resolved.monthStartDate.endsWith("-01")).toBe(true);
  });
});

describe("periodOverlapsRemittanceMonth", () => {
  it("detects overlapping coverage", () => {
    expect(
      periodOverlapsRemittanceMonth({
        periodStartDate: "2026-02-26",
        periodEndDate: "2026-03-10",
        monthStartDate: "2026-03-01",
        monthEndDate: "2026-03-31",
      }),
    ).toBe(true);
  });

  it("rejects periods outside the month", () => {
    expect(
      periodOverlapsRemittanceMonth({
        periodStartDate: "2026-01-01",
        periodEndDate: "2026-01-15",
        monthStartDate: "2026-03-01",
        monthEndDate: "2026-03-31",
      }),
    ).toBe(false);
  });
});

describe("buildRemittanceEmployeeRows", () => {
  it("aggregates EE government deductions by staff and sorts by name", () => {
    const rows = buildRemittanceEmployeeRows([
      {
        staffId: "b",
        fullName: "Ben Rivera",
        role: "mechanic",
        sssNumber: "11-1111111-1",
        philhealthNumber: null,
        pagibigNumber: "1212-1212-1212",
        tinNumber: null,
        systemKey: "sss",
        amount: 500,
      },
      {
        staffId: "a",
        fullName: "Ana Cruz",
        role: "cashier",
        sssNumber: "22-2222222-2",
        philhealthNumber: "12-345678901-2",
        pagibigNumber: "3434-3434-3434",
        tinNumber: "123-456-789",
        systemKey: "philhealth",
        amount: 400,
      },
      {
        staffId: "a",
        fullName: "Ana Cruz",
        role: "cashier",
        sssNumber: "22-2222222-2",
        philhealthNumber: "12-345678901-2",
        pagibigNumber: "3434-3434-3434",
        tinNumber: "123-456-789",
        systemKey: "sss",
        amount: 450,
      },
      {
        staffId: "a",
        fullName: "Ana Cruz",
        role: "cashier",
        sssNumber: "22-2222222-2",
        philhealthNumber: "12-345678901-2",
        pagibigNumber: "3434-3434-3434",
        tinNumber: "123-456-789",
        systemKey: "pagibig",
        amount: 100,
      },
      {
        staffId: "b",
        fullName: "Ben Rivera",
        role: "mechanic",
        sssNumber: "11-1111111-1",
        philhealthNumber: null,
        pagibigNumber: "1212-1212-1212",
        tinNumber: null,
        systemKey: "sss",
        amount: 500,
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.fullName).toBe("Ana Cruz");
    expect(rows[0]).toMatchObject({
      sssAmount: 450,
      philhealthAmount: 400,
      pagibigAmount: 100,
      totalAmount: 950,
      missingIdCount: 0,
    });
    expect(rows[1]).toMatchObject({
      fullName: "Ben Rivera",
      sssAmount: 1000,
      philhealthAmount: 0,
      pagibigAmount: 0,
      totalAmount: 1000,
      missingIdCount: 1,
    });
  });

  it("ignores zero amounts and unknown keys", () => {
    const rows = buildRemittanceEmployeeRows([
      {
        staffId: "a",
        fullName: "Ana Cruz",
        role: "cashier",
        sssNumber: null,
        philhealthNumber: null,
        pagibigNumber: null,
        tinNumber: null,
        systemKey: "sss",
        amount: 0,
      },
    ]);

    expect(rows).toEqual([]);
  });
});

describe("summarizeRemittanceRows", () => {
  it("sums employee contribution columns", () => {
    expect(
      summarizeRemittanceRows([
        {
          staffId: "a",
          fullName: "Ana",
          role: "cashier",
          sssNumber: null,
          philhealthNumber: null,
          pagibigNumber: null,
          tinNumber: null,
          sssAmount: 100,
          philhealthAmount: 50,
          pagibigAmount: 25,
          totalAmount: 175,
          missingIdCount: 3,
        },
        {
          staffId: "b",
          fullName: "Ben",
          role: "mechanic",
          sssNumber: null,
          philhealthNumber: null,
          pagibigNumber: null,
          tinNumber: null,
          sssAmount: 200,
          philhealthAmount: 75,
          pagibigAmount: 25,
          totalAmount: 300,
          missingIdCount: 3,
        },
      ]),
    ).toEqual({
      sssAmount: 300,
      philhealthAmount: 125,
      pagibigAmount: 50,
      totalAmount: 475,
    });
  });
});
