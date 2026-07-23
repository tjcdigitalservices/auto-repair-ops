import { describe, expect, it } from "vitest";

import { createDocumentEditorExtensions } from "@/components/document-engine/create-document-editor-extensions";

describe("createDocumentEditorExtensions", () => {
  it("registers paragraph, heading, list, alignment, and underline support", () => {
    const extensions = createDocumentEditorExtensions();
    const names = extensions.map((extension) => extension.name);

    expect(names).toContain("starterKit");
    expect(names).toContain("textAlign");
    expect(names).toContain("indent");
    expect(names).toContain("documentBlock");
    expect(names).toContain("mergeVariable");
  });
});
