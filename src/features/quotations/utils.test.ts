import { describe, expect, it } from "vitest";

import {
  calculateQuotationDiscountAmount,
  calculateQuotationGrandTotal,
  calculateQuotationTaxAmount,
  canReviseQuotation,
  createQuotationItem,
} from "@/features/quotations/utils";

describe("canReviseQuotation", () => {
  it("allows revise for approved quotations with an active editable job order", () => {
    expect(
      canReviseQuotation({
        status: "approved",
        jobOrderId: "job-order-1",
        jobOrderStatus: "in_progress",
        hasActiveInvoice: false,
      }),
    ).toBe(true);
  });

  it("blocks revise without a linked job order", () => {
    expect(
      canReviseQuotation({
        status: "approved",
        jobOrderId: null,
        jobOrderStatus: null,
      }),
    ).toBe(false);
  });

  it("blocks revise when an active invoice exists", () => {
    expect(
      canReviseQuotation({
        status: "approved",
        jobOrderId: "job-order-1",
        jobOrderStatus: "in_progress",
        hasActiveInvoice: true,
      }),
    ).toBe(false);
  });

  it("blocks revise for completed job orders", () => {
    expect(
      canReviseQuotation({
        status: "approved",
        jobOrderId: "job-order-1",
        jobOrderStatus: "completed",
      }),
    ).toBe(false);
  });
});

describe("quotation discount and tax", () => {
  it("computes fixed and percent discounts", () => {
    expect(
      calculateQuotationDiscountAmount({
        subtotal: 1000,
        discountInput: "150",
        discountMode: "fixed",
      }),
    ).toBe(150);

    expect(
      calculateQuotationDiscountAmount({
        subtotal: 1000,
        discountInput: "10",
        discountMode: "percent",
      }),
    ).toBe(100);
  });

  it("applies tax as a percentage of the taxable amount", () => {
    expect(
      calculateQuotationTaxAmount({
        subtotal: 1000,
        discountAmount: 100,
        taxRate: "12",
      }),
    ).toBe(108);
  });

  it("combines discount and tax into the grand total", () => {
    const items = [
      createQuotationItem({
        quantity: "1",
        unitPrice: "1000",
      }),
    ];
    const discount = calculateQuotationDiscountAmount({
      subtotal: 1000,
      discountInput: "10",
      discountMode: "percent",
    });
    const tax = calculateQuotationTaxAmount({
      subtotal: 1000,
      discountAmount: discount,
      taxRate: "12",
    });

    expect(
      calculateQuotationGrandTotal({
        items,
        discount: String(discount),
        tax: String(tax),
      }),
    ).toBe(1008);
  });
});
