import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_DOCUMENT_BODY } from "@/components/document-engine/constants";
import { BlankDocumentPreviewComposer } from "@/components/reports/blank-document-preview-composer";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

describe("BlankDocumentPreviewComposer", () => {
  it("keeps print as the sole primary header action without an overflow menu", () => {
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

    const titleInput = screen.getByLabelText("Document title");

    fireEvent.change(titleInput, { target: { value: "Customer Notice" } });

    expect(
      screen.getByRole("heading", { name: "Customer Notice" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Document Body")).toHaveTextContent(DEFAULT_DOCUMENT_BODY);
    expect(screen.getByRole("button", { name: "Print" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Document actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Zoom" })).toBeInTheDocument();
  });
});
