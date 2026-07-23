import { describe, expect, it } from "vitest";

import {
  getDocumentBlock,
  listDocumentBlocks,
  listInsertableDocumentBlocks,
  registerDocumentBlock,
} from "@/components/document-engine/blocks/registry";
import { StickyNote } from "lucide-react";

describe("document block registry", () => {
  it("registers the initial smart document blocks", () => {
    expect(listDocumentBlocks().map((block) => block.id).sort()).toEqual([
      "company-information",
      "customer-information",
      "divider",
      "image-placeholder",
      "notes",
      "signature",
      "vehicle-information",
    ]);
  });

  it("exposes content blocks separately from quick-insert blocks", () => {
    expect(listInsertableDocumentBlocks().map((block) => block.id)).toEqual([
      "customer-information",
      "vehicle-information",
      "company-information",
      "notes",
    ]);
  });

  it("allows future modules to register new blocks", () => {
    registerDocumentBlock({
      id: "custom-block",
      label: "Custom Block",
      icon: StickyNote,
      RenderComponent: () => null,
    });

    expect(getDocumentBlock("custom-block")?.label).toBe("Custom Block");
  });
});
