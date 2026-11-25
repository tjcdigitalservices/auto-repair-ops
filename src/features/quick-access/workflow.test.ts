import { describe, expect, it } from "vitest";

import {
  buildQuickAccessBillingHref,
  findLatestActiveQuotationForVehicle,
  resolveQuickAccessPrimaryAction,
} from "@/features/quick-access/workflow";
import type { QuickAccessPermissions } from "@/features/quick-access/types";
import type { QuotationListItem } from "@/features/quotations/types";

const basePermissions: QuickAccessPermissions = {
  canCreateQuotations: true,
  canCreateVehicle: true,
  canViewQuotations: true,
  canViewJobOrders: true,
  canViewServiceHistory: true,
  canRecordPastService: true,
};

function quotation(partial: Partial<QuotationListItem> & Pick<QuotationListItem, "id" | "status">) {
  return {
    id: partial.id,
    quotationNumber: partial.quotationNumber ?? "Q-001",
    branchId: "branch-1",
    customerId: partial.customerId ?? "customer-1",
    customerName: partial.customerName ?? "Charlie Mae Coyoca",
    vehicleId: partial.vehicleId ?? "vehicle-1",
    vehicleLabel: partial.vehicleLabel ?? "Nissan Navara · FAO9630",
    status: partial.status,
    subtotal: 0,
    discount: 0,
    tax: 0,
    totalAmount: 0,
    quotationDate: partial.quotationDate ?? "2026-07-27",
    createdAt: partial.createdAt ?? "2026-07-27T00:00:00.000Z",
    approvedAt: partial.approvedAt ?? null,
  } satisfies QuotationListItem;
}

describe("resolveQuickAccessPrimaryAction", () => {
  it("offers a new quotation when no active quotation exists for the vehicle", () => {
    const action = resolveQuickAccessPrimaryAction({
      customerId: "customer-1",
      vehicleId: "vehicle-1",
      recentQuotations: [],
      jobOrdersByQuotationId: new Map(),
      permissions: basePermissions,
    });

    expect(action.label).toBe("New Quotation");
    expect(action.href).toContain("customerId=customer-1");
    expect(action.href).toContain("vehicleId=vehicle-1");
  });

  it("continues a draft quotation", () => {
    const action = resolveQuickAccessPrimaryAction({
      customerId: "customer-1",
      vehicleId: "vehicle-1",
      recentQuotations: [quotation({ id: "quote-1", status: "draft" })],
      jobOrdersByQuotationId: new Map(),
      permissions: basePermissions,
    });

    expect(action.label).toBe("Continue Draft Quotation");
    expect(action.href).toBe("/quotations/quote-1/edit");
  });

  it("routes ready-for-billing job orders to billing", () => {
    const action = resolveQuickAccessPrimaryAction({
      customerId: "customer-1",
      vehicleId: "vehicle-1",
      recentQuotations: [quotation({ id: "quote-1", status: "approved" })],
      jobOrdersByQuotationId: new Map([
        [
          "quote-1",
          {
            id: "job-1",
            quotationId: "quote-1",
            vehicleId: "vehicle-1",
            status: "ready_for_billing",
            invoiceId: "invoice-1",
          },
        ],
      ]),
      permissions: basePermissions,
    });

    expect(action.label).toBe("Open Billing");
    expect(action.href).toBe("/invoices/invoice-1");
  });

  it("ignores rejected quotations when finding the latest active quotation", () => {
    const latest = findLatestActiveQuotationForVehicle(
      [
        quotation({ id: "quote-1", status: "rejected", createdAt: "2026-07-27T00:00:00.000Z" }),
        quotation({ id: "quote-2", status: "draft", createdAt: "2026-07-26T00:00:00.000Z" }),
      ],
      "vehicle-1",
    );

    expect(latest?.id).toBe("quote-2");
  });
});

describe("buildQuickAccessBillingHref", () => {
  it("prefers an existing invoice", () => {
    expect(
      buildQuickAccessBillingHref({
        id: "job-1",
        invoiceId: "invoice-1",
      }),
    ).toBe("/invoices/invoice-1");
  });
});
