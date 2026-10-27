export const SANDBOX_COOKIE = "ars-sandbox";

export const SANDBOX_PATH_PREFIXES = [
  "/dashboard",
  "/quick-access",
  "/customers",
  "/vehicles",
  "/quotations",
  "/job-orders",
  "/inventory",
  "/products",
  "/services",
  "/suppliers",
  "/invoices",
  "/payments",
  "/pos",
  "/staff",
  "/attendance",
  "/portal",
  "/payroll",
  "/reports",
  "/documents",
  "/settings",
] as const;

export function stripSandboxBasePath(pathname: string) {
  if (pathname === "/sandbox") {
    return "/dashboard";
  }

  if (pathname.startsWith("/sandbox/")) {
    return pathname.slice("/sandbox".length);
  }

  return pathname;
}

export function sandboxAppPath(pathname: string) {
  const tenantMatch = pathname.match(/^\/t\/[a-z0-9-]+(\/.*)?$/);
  const appPath = tenantMatch ? tenantMatch[1] || "/" : pathname;
  return stripSandboxBasePath(appPath);
}

export function isSandboxAppPath(pathname: string) {
  const appPath = sandboxAppPath(pathname);
  return SANDBOX_PATH_PREFIXES.some(
    (prefix) => appPath === prefix || appPath.startsWith(`${prefix}/`),
  );
}
