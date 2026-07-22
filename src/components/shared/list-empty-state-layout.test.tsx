import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/shared/app-shell";
import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/suppliers",
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

vi.mock("@/features/auth/actions/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

describe("list empty-state layout", () => {
  it("keeps continuous shell chrome without viewport-fixing the desktop sidebar", () => {
    const { container } = render(
      <AppShell
        navigationItems={[
          {
            href: "/suppliers",
            label: "Suppliers",
            description: "Supplier directory",
            group: "Stock & Catalog",
            iconName: "suppliers",
          },
        ]}
        userDisplayName="Alex"
        userRoleLabel="Administrator"
        capabilities={[]}
        businessName="SAY Auto Care Center"
        businessLogoUrl={null}
      >
        <DataTableCard>
          <EmptyState
            title="No suppliers found"
            description="Add your first supplier so product records can reference sourcing details."
          />
        </DataTableCard>
      </AppShell>,
    );

    const shell = container.firstElementChild;
    expect(shell?.className).toMatch(/relative/);
    expect(shell?.className).toMatch(/min-h-svh/);
    // Content column must not be forced to viewport height (that stretched list cards).
    expect(shell?.className).not.toMatch(/\bh-screen\b/);

    // Desktop rail tracks the shell box (absolute inset-y-0), not a separate fixed viewport rail.
    const desktopRail = shell?.children[0] as HTMLElement | undefined;
    expect(desktopRail?.className).toMatch(/absolute/);
    expect(desktopRail?.className).toMatch(/inset-y-0/);
    expect(desktopRail?.className).not.toMatch(/fixed/);

    expect(screen.getByRole("heading", { name: "No suppliers found" })).toBeInTheDocument();
  });

  it("keeps DataTableCard and EmptyState content-sized", () => {
    const { container } = render(
      <DataTableCard>
        <EmptyState title="No records" description="Create the first record to get started." />
      </DataTableCard>,
    );

    const card = container.firstElementChild;
    const emptyState = container.querySelector("[data-empty-state]");

    expect(card?.className).toMatch(/h-fit/);
    expect(card?.className).not.toMatch(/min-h-|h-screen/);
    expect(emptyState?.className).toMatch(/h-fit/);
    expect(emptyState?.className).not.toMatch(/min-h-|h-screen|justify-center/);
  });
});
