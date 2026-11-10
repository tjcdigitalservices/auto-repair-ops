import { afterEach, describe, expect, it } from "vitest";

import {
  paginateDocumentHtml,
  paginateDocumentPages,
} from "@/components/document-engine/page-manager/paginate-document-html";
import { createPageManager } from "@/components/document-engine/page-manager/page-manager";

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
    const pages = paginateDocumentHtml("<p>Short business note.</p>", {
      maxHeightPx: 780,
      contentWidthPx: 700,
    });

    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain("Short business note.");
  });

  it("keeps multiple paragraphs on one page when they fit the height budget", () => {
    mockGrowingPageHeight(20);

    const body = Array.from({ length: 8 }, (_, index) => `<p>Paragraph ${index + 1}</p>`).join("");
    const pages = paginateDocumentHtml(body, { maxHeightPx: 200, contentWidthPx: 700 });

    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain("Paragraph 1");
    expect(pages[0]).toContain("Paragraph 8");
  });

  it("splits long content across multiple pages", () => {
    mockGrowingPageHeight(40);

    const longBody = Array.from({ length: 40 }, (_, index) => `<p>Paragraph ${index + 1}</p>`).join("");
    const pages = paginateDocumentHtml(longBody, { maxHeightPx: 120, contentWidthPx: 700 });

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0]).toContain("Paragraph 1");
    expect(pages.at(-1)).toContain("Paragraph 40");
  });

  it("splits a single oversized paragraph across pages", () => {
  const longText = Array.from({ length: 400 }, () => "lorem").join(" ");

    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        const element = this as HTMLElement;
        const text = element.textContent ?? "";
        const words = text.split(/\s+/).filter(Boolean).length;
        return words > 0 ? words * 4 : element.childElementCount * 4;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get() {
        return (this as HTMLElement).offsetHeight;
      },
    });

    const pages = paginateDocumentHtml(`<p>${longText}</p>`, {
      maxHeightPx: 120,
      contentWidthPx: 700,
    });

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.join(" ")).toContain("lorem");
  });
});

describe("paginateDocumentPages", () => {
  it("includes block indexes and cumulative start offsets", () => {
    mockGrowingPageHeight(40);

    const longBody = Array.from({ length: 10 }, (_, index) => `<p>Paragraph ${index + 1}</p>`).join(
      "",
    );
    const pages = paginateDocumentPages(longBody, { maxHeightPx: 120, contentWidthPx: 700 });

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0]?.startBlockIndex).toBe(0);
    expect(pages[0]?.startOffsetPx).toBe(0);
    expect(pages[1]?.startBlockIndex).toBe(pages[0]?.endBlockIndex);
    expect(pages[1]?.startOffsetPx).toBeGreaterThan(0);

    for (let index = 1; index < pages.length; index += 1) {
      expect(pages[index]?.startBlockIndex).toBe(pages[index - 1]?.endBlockIndex);
      expect(pages[index]?.startOffsetPx).toBeGreaterThan(pages[index - 1]?.startOffsetPx ?? 0);
    }
  });
});

describe("PageManager", () => {
  it("tracks page slices and page count", () => {
    const manager = createPageManager();
    const snapshot = manager.paginate("<p>One page</p>", { maxHeightPx: 780, contentWidthPx: 700 });

    expect(snapshot.pageCount).toBe(1);
    expect(snapshot.pages[0]?.html).toContain("One page");
    expect(snapshot.pages[0]?.startBlockIndex).toBe(0);
    expect(snapshot.pages[0]?.startOffsetPx).toBe(0);
  });
});
