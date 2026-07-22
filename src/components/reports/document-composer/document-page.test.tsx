import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocumentEditorProvider } from "@/components/reports/document-composer/document-editor-context";
import { DocumentPage } from "@/components/reports/document-composer/document-page";
import { createDocumentEditorExtensions } from "@/components/reports/document-composer/create-document-editor-extensions";
import { DEFAULT_DOCUMENT_BODY_HTML } from "@/components/reports/document-composer/constants";
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
    content: DEFAULT_DOCUMENT_BODY_HTML,
  });

  return (
    <DocumentEditorProvider editor={editor}>
      <DocumentPage
        businessProfile={{
          businessName: "SAY Auto Care Center",
          businessLogoUrl: null,
          businessVatRegistrationNo: "123-456-789-000",
          businessContact: "09171234567",
          businessEmail: "hello@sayautocare.com",
          businessAddress: "Quezon City",
          websiteUrl: null,
          facebookLabel: null,
        }}
        documentTitle="Blank Document"
        documentMeta="Internal blank document • Main Branch"
      />
    </DocumentEditorProvider>
  );
}

describe("DocumentPage", () => {
  it("uses a pinned three-region A4 layout with template header and footer", () => {
    const { container } = render(<DocumentPageHarness />);

    expect(container.querySelector(".print-page--document")).not.toBeNull();
    expect(container.querySelector(".print-page-inner--document")).not.toBeNull();
    expect(container.querySelector(".document-template-header")).not.toBeNull();
    expect(container.querySelector(".document-editable-region")).not.toBeNull();
    expect(container.querySelector(".document-template-footer")).not.toBeNull();
    expect(container.querySelector(".document-page-body-host")).not.toBeNull();
    const pageStack = container.querySelector(".document-page-stack");
    expect(pageStack).not.toBeNull();
    expect(within(pageStack as HTMLElement).getByText("VAT Reg. No.: 123-456-789-000")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
