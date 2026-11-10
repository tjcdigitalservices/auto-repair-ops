import { describe, expect, it } from "vitest";

import { SANDBOX_IDS } from "@/features/sandbox/ids";
import { deleteCustomerRecord, recordPaymentRecord, saveCustomerRecord, upsertAttendanceRecord } from "@/features/sandbox/records";
import { createSandboxSeed } from "@/features/sandbox/seed";
import { createMemoryDriver, createSandboxController } from "@/features/sandbox/store";
import { toSandboxPayrollPeriodDetail, toSandboxPayslipPrintDocument, toSandboxRemittanceSummary } from "@/features/sandbox/payroll";
import { toAttendancePageData } from "@/features/sandbox/view-models";

describe("sandbox shop", () => {
  it("seeds once, keeps a new customer across a reload, and resets", async () => {
    const driver = createMemoryDriver();
    const firstVisit = createSandboxController(driver);
    const seeded = await firstVisit.load();
    const seedCount = seeded.customers.length;

    await firstVisit.load();
    expect(firstVisit.getSnapshot()?.customers).toHaveLength(seedCount);

    const saved = saveCustomerRecord(seeded, {
      customerType: "individual",
      firstName: "Nora",
      lastName: "Villanueva",
      companyName: "",
      contactNumber: "0917 444 1212",
      email: "nora@example.com",
      address: "Makati",
      notes: "",
      status: "active",
      createPortalLogin: false,
    });
    await firstVisit.update(() => saved.snapshot);

    const reloaded = createSandboxController(driver);
    const persisted = await reloaded.load();
    expect(persisted.customers.map((customer) => customer.displayName)).toContain("Nora Villanueva");
    expect(persisted.customers).toHaveLength(seedCount + 1);

    const reset = await reloaded.reset();
    expect(reset.customers).toHaveLength(seedCount);
    expect(reset.customers.map((customer) => customer.displayName)).not.toContain("Nora Villanueva");
  });

  it("refuses to delete a customer who still has a vehicle", () => {
    const snapshot = createSandboxSeed();
    const result = deleteCustomerRecord(snapshot, SANDBOX_IDS.customerMaria);
    expect(result.ok).toBe(false);
  });

  it("applies a payment against the remaining invoice balance", () => {
    const snapshot = createSandboxSeed();
    const invoice = snapshot.invoices.find((item) => item.id === SANDBOX_IDS.invoice);
    expect(invoice?.balance).toBe(950);

    const result = recordPaymentRecord(snapshot, {
      invoiceId: SANDBOX_IDS.invoice,
      amount: "200",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "Follow-up collection",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const updated = result.snapshot.invoices.find((item) => item.id === SANDBOX_IDS.invoice);
    expect(updated?.paidAmount).toBe(700);
    expect(updated?.balance).toBe(750);
    expect(updated?.status).toBe("partially_paid");
  });

  it("builds the owner attendance workspace and keeps a local edit", () => {
    const snapshot = createSandboxSeed(new Date("2026-10-14T02:00:00.000Z"));
    const page = toAttendancePageData(snapshot, new URLSearchParams({ date: "2026-10-14" }));
    const attendanceNames = page.attendanceData.roster.map((item) => item.fullName);

    expect(attendanceNames).toEqual(expect.arrayContaining(["Carlo Dela Cruz", "Liza Navarro"]));
    expect(attendanceNames).not.toContain("Amina Cruz");
    expect(page.rosterData.roster.map((item) => item.fullName)).toContain("Amina Cruz");
    expect(page.attendanceData.roster.find((item) => item.fullName === "Carlo Dela Cruz")?.attendance?.status).toBe("present");
    expect(page.attendanceCalendar.days.some((day) => day.recordedCount > 0)).toBe(true);

    const updated = upsertAttendanceRecord(snapshot, {
      staffId: SANDBOX_IDS.advisor,
      attendanceDate: "2026-10-14",
      status: "late",
      timeIn: "2026-10-14T01:00:00.000Z",
      timeOut: "2026-10-14T09:00:00.000Z",
      notes: null,
    });
    const next = toAttendancePageData(updated, new URLSearchParams({ date: "2026-10-14" }));
    expect(next.attendanceData.roster.find((item) => item.fullName === "Liza Navarro")?.attendance?.status).toBe("late");
  });

  it("builds a printable payroll cut with remittance for the current month", () => {
    const snapshot = createSandboxSeed(new Date("2026-10-14T02:00:00.000Z"));
    const detail = toSandboxPayrollPeriodDetail(snapshot, SANDBOX_IDS.payroll);
    const payslip = toSandboxPayslipPrintDocument(snapshot, SANDBOX_IDS.payroll, SANDBOX_IDS.payrollItem);
    const remittance = toSandboxRemittanceSummary(snapshot, "2026-10");

    expect(detail?.items.map((item) => item.fullName)).toEqual(["Carlo Dela Cruz", "Liza Navarro"]);
    expect(payslip?.item.netPay).toBeGreaterThan(0);
    expect(payslip?.item.sssNumber).toBe("34-1234567-8");
    expect(payslip?.item.adjustments.some((adjustment) => adjustment.label === "Shop performance bonus")).toBe(true);
    expect(remittance.employees).toHaveLength(2);
    expect(remittance.totals.sssAmount).toBeGreaterThan(0);
  });
});
