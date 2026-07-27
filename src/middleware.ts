import { NextResponse, type NextRequest } from "next/server";

import {
  copyResponseCookies,
  updateSupabaseSession,
} from "@/lib/supabase/middleware";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

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

  const sessionResponse = await updateSupabaseSession(request, requestHeaders);

  const rewriteMatch = pathname.match(/^\/t\/([a-z0-9-]+)(\/.*)?$/);
  if (rewriteMatch) {
    const rest = rewriteMatch[2] || "/";
    const url = request.nextUrl.clone();
    url.pathname = rest;
    const rewriteResponse = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    copyResponseCookies(sessionResponse, rewriteResponse);

    const rewrittenSlug = rewriteMatch[1].toLowerCase();
    if (request.cookies.get(TENANT_SLUG_COOKIE)?.value !== rewrittenSlug) {
      rewriteResponse.cookies.set(TENANT_SLUG_COOKIE, rewrittenSlug, {
        path: "/",
        sameSite: "lax",
      });
    }

    return rewriteResponse;
  }

  if (
    request.method === "GET" &&
    request.cookies.get(TENANT_SLUG_COOKIE)?.value !== slug
  ) {
    sessionResponse.cookies.set(TENANT_SLUG_COOKIE, slug, {
      path: "/",
      sameSite: "lax",
    });
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
  ],
};
