import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicSiteShell } from "@/features/website/components/public-site-shell";
import type { WebsiteShellData } from "@/features/website/types";
import { DEFAULT_BRAND_PACK } from "@/lib/branding/types";

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: Record<string, unknown>) => <img {...props} />,
}));

const shellData: WebsiteShellData = {
  businessName: "Auto Repair Shop",
  businessLogoUrl: null,
  branchName: "Main Branch",
  address: "123 Service Road",
  contactNumber: "09171234567",
  email: "shop@example.com",
  logoSrc: DEFAULT_BRAND_PACK.logoSrc,
  markSrc: DEFAULT_BRAND_PACK.markSrc,
  facebookUrl: "https://www.facebook.com/example",
  facebookLabel: "Auto Repair Shop",
  mapsUrl: "https://maps.example.com/shop",
  websiteUrl: "https://example.com",
  storeHours: [...DEFAULT_BRAND_PACK.storeHours],
  tagline: DEFAULT_BRAND_PACK.tagline,
  companyName: DEFAULT_BRAND_PACK.companyName,
  heroBackgroundSrc: DEFAULT_BRAND_PACK.heroBackgroundSrc,
  featureBackgroundSrc: DEFAULT_BRAND_PACK.featureBackgroundSrc,
  googleReviewsUrl: null,
};

describe("PublicSiteShell", () => {
  beforeEach(() => {
    pathname = "/";
  });

  it("opens and closes the mobile navigation menu from the hamburger button", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Services" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Catalog" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Brands" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();
  });

  it("uses the branding logo fallback consistently in the public header", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    const logos = screen.getAllByAltText("Auto Repair Shop");

    expect(logos[0]).toHaveAttribute("src", expect.stringContaining(DEFAULT_BRAND_PACK.logoSrc));
    expect(screen.queryByAltText("Auto Repair Shop shield")).not.toBeInTheDocument();
  });

  it("shows the updated store hours in the public footer", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    expect(screen.getByText("Store Hours")).toBeInTheDocument();
    expect(screen.getByText("Monday – Saturday")).toBeInTheDocument();
    expect(screen.getByText("7:00 AM – 5:00 PM")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("renders the footer address link with the expected Google Maps URL", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    expect(
      screen.getByRole("link", { name: "Open 123 Service Road in Google Maps" }),
    ).toHaveAttribute("href", "https://maps.example.com/shop");
    expect(
      screen.getByRole("link", { name: "Open 123 Service Road in Google Maps" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "Open 123 Service Road in Google Maps" }),
    ).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the footer Facebook link with the expected external URL", () => {
    render(
      <PublicSiteShell shellData={shellData}>
        <div>Home page content</div>
      </PublicSiteShell>,
    );

    expect(screen.getByRole("link", { name: "Visit Auto Repair Shop on Facebook" })).toHaveAttribute(
      "href",
      "https://www.facebook.com/example",
    );
    expect(screen.getByRole("link", { name: "Visit Auto Repair Shop on Facebook" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "Visit Auto Repair Shop on Facebook" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
});
