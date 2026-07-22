import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_DOCUMENT_BODY } from "@/components/reports/blank-document/constants";
import { BlankDocumentPreviewComposer } from "@/components/reports/blank-document-preview-composer";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

describe("BlankDocumentPreviewComposer", () => {
  it("updates the live preview from the title editor and renders rich-text defaults", () => {
    render(
      <BlankDocumentPreviewComposer
        businessName="SAY Auto Care Center"
        businessLogoUrl={null}
        businessVatRegistrationNo="123-456-789-000"
        businessContact="09171234567"
        businessEmail="hello@sayautocare.com"
        businessAddress="Quezon City"
        branchName="Main Branch"
      />,
    );

    const titleInput = screen.getByLabelText("Document Title");

    fireEvent.change(titleInput, { target: { value: "Customer Notice" } });

    expect(
      screen.getByRole("heading", { name: "Customer Notice" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(DEFAULT_DOCUMENT_BODY).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeDisabled();
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Document actions" })).toBeInTheDocument();
    expect(screen.getByLabelText("Document Body")).toBeInTheDocument();
  });
});
