import { describe, expect, it } from "vitest";

import {
  DOCUMENT_TEMPLATES,
  getDocumentTemplate,
  listDocumentTemplates,
} from "@/components/document-engine/templates/registry";

describe("document template registry", () => {
  it("registers all printable ERP templates", () => {
    expect(Object.keys(DOCUMENT_TEMPLATES).sort()).toEqual([
      "blank",
      "invoice",
      "job-order",
      "quotation",
      "receipt",
    ]);
    expect(listDocumentTemplates()).toHaveLength(5);
  });

  it("provides page layout, header/footer renderers, and default body content", () => {
    const quotation = getDocumentTemplate("quotation");

    expect(quotation.label).toBe("Quotation");
    expect(quotation.defaultDocumentTitle).toBe("QUOTATION");
    expect(JSON.stringify(quotation.defaultContentJson)).toContain("quotation");
    expect(quotation.pageLayout.horizontalPaddingClassName).toBe("px-[8mm]");
    expect(typeof quotation.renderHeader).toBe("function");
    expect(typeof quotation.renderFooter).toBe("function");
  });

  it("allows job orders to customize margins without affecting blank documents", () => {
    const blank = getDocumentTemplate("blank");
    const jobOrder = getDocumentTemplate("job-order");

    expect(blank.pageLayout.topPaddingClassName).toBe("pt-[8mm]");
    expect(jobOrder.pageLayout.topPaddingClassName).toBe("pt-[7mm]");
    expect(jobOrder.pageLayout.bodyClassName).toContain("job-order-print-body");
  });
});
