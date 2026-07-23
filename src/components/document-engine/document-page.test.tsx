import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocumentPaginatedPages } from "@/components/document-engine/document-paginated-pages";
import { DocumentEditorProvider } from "@/components/document-engine/hooks/document-editor-context";
import { getDocumentTemplate } from "@/components/document-engine/templates/registry";
import { createDocumentEditorExtensions } from "@/components/document-engine/create-document-editor-extensions";
import { createDefaultDocumentJson } from "@/components/document-engine/persistence/document-content";
import { useEditor } from "@tiptap/react";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

function DocumentPageHarness() {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: createDocumentEditorExtensions(),
    content: createDefaultDocumentJson("This area is reserved for future document content."),
  });

  return (
    <DocumentEditorProvider editor={editor}>
      <DocumentPaginatedPages
        template={getDocumentTemplate("blank")}
        baseContext={{
          businessProfile: {
            businessName: "SAY Auto Care Center",
            businessLogoUrl: null,
            businessVatRegistrationNo: "123-456-789-000",
            businessContact: "09171234567",
            businessEmail: "hello@sayautocare.com",
            businessAddress: "Quezon City",
            websiteUrl: null,
            facebookLabel: null,
          },
          documentTitle: "Blank Document",
        }}
      />
    </DocumentEditorProvider>
  );
}

describe("DocumentPaginatedPages", () => {
  it("uses a pinned three-region A4 layout with template header and footer", () => {
    const { container } = render(<DocumentPageHarness />);

    expect(container.querySelector(".print-page--document")).not.toBeNull();
    expect(container.querySelector(".print-page-inner--document")).not.toBeNull();
    expect(container.querySelector(".document-template-header")).not.toBeNull();
    expect(container.querySelector(".document-editable-region")).not.toBeNull();
    expect(container.querySelector(".document-template-footer")).not.toBeNull();
    expect(screen.getByText("VAT Reg. No.: 123-456-789-000")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
