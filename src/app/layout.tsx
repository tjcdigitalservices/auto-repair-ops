import type { Metadata } from "next";
import { Barlow_Condensed, Space_Grotesk } from "next/font/google";
import "./globals.css";

import { AppProviders } from "@/components/shared/providers/app-providers";
import { getRequestTenantBranding } from "@/lib/branding";
import { resolveThemeCssVars } from "@/lib/branding/types";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["400", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getRequestTenantBranding();

  return {
    title: branding.metaTitle,
    description: branding.metaDescription,
    icons: {
      icon: [{ url: branding.faviconSrc, type: "image/png" }],
      apple: [{ url: branding.appleTouchIconSrc, sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getRequestTenantBranding();
  const themeCssVars = resolveThemeCssVars(branding);

  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root {\n${themeCssVars}\n}`,
          }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
