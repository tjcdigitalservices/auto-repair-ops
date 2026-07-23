import { describe, expect, it } from "vitest";

import { paginateDocumentHtml } from "@/components/document-engine/page-manager/paginate-document-html";
import { createPageManager } from "@/components/document-engine/page-manager/page-manager";

describe("paginateDocumentHtml", () => {
  it("returns a single page for short content", () => {
    const pages = paginateDocumentHtml("<p>Short business note.</p>", {
      maxHeightPx: 780,
      contentWidthPx: 700,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain("Short business note.");
  });

  it("splits long content across multiple pages", () => {
    const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight",
    );

    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get: () => 40,
    });

    try {
      const longBody = Array.from({ length: 40 }, (_, index) => `<p>Paragraph ${index + 1}</p>`).join("");
      const pages = paginateDocumentHtml(longBody, { maxHeightPx: 120, contentWidthPx: 700 });

      expect(pages.length).toBeGreaterThan(1);
      expect(pages[0]).toContain("Paragraph 1");
      expect(pages.at(-1)).toContain("Paragraph 40");
    } finally {
      if (offsetHeightDescriptor) {
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", offsetHeightDescriptor);
      }
    }
  });
});

describe("PageManager", () => {
  it("tracks page slices and page count", () => {
    const manager = createPageManager();
    const snapshot = manager.paginate("<p>One page</p>", { maxHeightPx: 780, contentWidthPx: 700 });

    expect(snapshot.pageCount).toBe(1);
    expect(snapshot.pages[0]?.html).toContain("One page");
  });
});
