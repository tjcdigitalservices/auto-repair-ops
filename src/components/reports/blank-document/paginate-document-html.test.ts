import { afterEach, describe, expect, it } from "vitest";

import { paginateDocumentHtml } from "@/components/reports/blank-document/paginate-document-html";

const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
);
const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollHeight",
);

afterEach(() => {
  if (offsetHeightDescriptor) {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", offsetHeightDescriptor);
  }
  if (scrollHeightDescriptor) {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", scrollHeightDescriptor);
  }
});

function mockGrowingPageHeight(pixelsPerChild: number) {
  const readHeight = (element: HTMLElement) => {
    const childCount = element.childElementCount;
    return childCount > 0 ? childCount * pixelsPerChild : pixelsPerChild;
  };

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return readHeight(this as HTMLElement);
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get() {
      return readHeight(this as HTMLElement);
    },
  });
}

describe("paginateDocumentHtml", () => {
  it("returns a single page for short content", () => {
    const pages = paginateDocumentHtml("<p>Short business note.</p>", 780, 700);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain("Short business note.");
  });

  it("splits long content across multiple pages", () => {
    mockGrowingPageHeight(40);

    const longBody = Array.from({ length: 40 }, (_, index) => `<p>Paragraph ${index + 1}</p>`).join("");
    const pages = paginateDocumentHtml(longBody, 120, 700);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0]).toContain("Paragraph 1");
    expect(pages.at(-1)).toContain("Paragraph 40");
  });
});
