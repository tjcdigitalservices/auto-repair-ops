import { NextResponse, type NextRequest } from "next/server";

const TENANT_SLUG_COOKIE = "tenant_slug";
const TENANT_SLUG_HEADER = "x-tenant-slug";

function extractTenantSlug(request: NextRequest): string {
  const pathMatch = request.nextUrl.pathname.match(/^\/t\/([a-z0-9-]+)(?:\/|$)/);
  if (pathMatch?.[1]) {
    return pathMatch[1].toLowerCase();
  }

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();

  if (rootDomain && host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.slice(0, -(rootDomain.length + 1));
    if (subdomain && !["www", "app", "platform"].includes(subdomain)) {
      return subdomain;
    }
  }

  const fromQuery = request.nextUrl.searchParams.get("tenant");
  if (fromQuery) {
    return fromQuery.toLowerCase();
  }

  return (
    request.cookies.get(TENANT_SLUG_COOKIE)?.value?.toLowerCase() ||
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.toLowerCase() ||
    "legacy"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never touch framework / HMR traffic (prevents Turbopack compile loops).
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Leave Server Action POSTs untouched — mutating them causes "Failed to fetch".
  if (
    request.method !== "GET" &&
    (request.headers.has("next-action") ||
      request.headers.get("content-type")?.includes("multipart/form-data"))
  ) {
    return NextResponse.next();
  }

  const slug = extractTenantSlug(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_SLUG_HEADER, slug);

  // Rewrite /t/{slug}/... → /... for public tenant path prefix
  const rewriteMatch = pathname.match(/^\/t\/([a-z0-9-]+)(\/.*)?$/);
  if (rewriteMatch) {
    const rest = rewriteMatch[2] || "/";
    const url = request.nextUrl.clone();
    url.pathname = rest;
    const rewriteResponse = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    const rewrittenSlug = rewriteMatch[1].toLowerCase();
    if (request.cookies.get(TENANT_SLUG_COOKIE)?.value !== rewrittenSlug) {
      rewriteResponse.cookies.set(TENANT_SLUG_COOKIE, rewrittenSlug, {
        path: "/",
        sameSite: "lax",
      });
    }
    return rewriteResponse;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Avoid mutating cookies on Server Action / mutation POSTs (can break Next CSRF).
  if (
    request.method === "GET" &&
    request.cookies.get(TENANT_SLUG_COOKIE)?.value !== slug
  ) {
    response.cookies.set(TENANT_SLUG_COOKIE, slug, {
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - api
     * - _next (all Turbopack / webpack / HMR / static internals)
     * - static file extensions
     */
    "/((?!api|_next|.*\\..*).*)",
  ],
};
