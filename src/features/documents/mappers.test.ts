import { describe, expect, it } from "vitest";

import {
  buildDuplicateDocumentTitle,
  normalizeDocumentTitle,
} from "@/features/documents/mappers";

describe("document mappers", () => {
  it("builds duplicate titles without stacking copy prefixes", () => {
    expect(buildDuplicateDocumentTitle("Customer Notice")).toBe("Copy of Customer Notice");
    expect(buildDuplicateDocumentTitle("Copy of Customer Notice")).toBe("Copy of Customer Notice");
  });

  it("normalizes blank titles to a fallback", () => {
    expect(normalizeDocumentTitle("  ", "Untitled document")).toBe("Untitled document");
    expect(normalizeDocumentTitle(" Memo ", "Untitled document")).toBe("Memo");
  });
});
