import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_DOCUMENT_BODY } from "@/components/reports/document-composer/constants";
import { BlankDocumentPreviewComposer } from "@/components/reports/blank-document-preview-composer";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

describe("BlankDocumentPreviewComposer", () => {
  it("places print in the page header and secondary actions in the overflow menu", async () => {
    const user = userEvent.setup();

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
    expect(screen.queryByRole("toolbar", { name: "Document actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeInTheDocument();
    expect(screen.getByLabelText("Document Body")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Zoom" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Document actions" }));

    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Export PDF" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(menu).getByRole("menuitem", { name: "Download PDF" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
