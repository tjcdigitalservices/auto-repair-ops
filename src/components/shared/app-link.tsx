import NextLink from "next/link";
import type { ComponentProps } from "react";

type AppLinkProps = ComponentProps<typeof NextLink>;

/**
 * Next.js Link wrapper that suppresses hydration warnings on anchor attributes.
 * Password-manager extensions often inject classes into links before React hydrates.
 */
export function AppLink({
  suppressHydrationWarning = true,
  ...props
}: AppLinkProps) {
  return <NextLink suppressHydrationWarning={suppressHydrationWarning} {...props} />;
}
