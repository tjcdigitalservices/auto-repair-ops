import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only allow relative print paths for the shop document viewer. */
function sanitizeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return null;
  }
  if (!/^\/(quotations|job-orders|invoices)\/[^/]+\/print(?:\?.*)?$/.test(value)) {
    return null;
  }
  return value;
}

/**
 * Mobile WebView bridge: accept a bearer session, set Supabase SSR cookies via
 * createServerClient.setSession, then redirect to the print page.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let accessToken = "";
  let refreshToken = "";
  let nextPath: string | null = null;

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      access_token?: string;
      refresh_token?: string;
      next?: string;
    };
    accessToken = body.access_token?.trim() ?? "";
    refreshToken = body.refresh_token?.trim() ?? "";
    nextPath = sanitizeNextPath(body.next ?? null);
  } else {
    const form = await request.formData();
    accessToken = String(form.get("access_token") ?? "").trim();
    refreshToken = String(form.get("refresh_token") ?? "").trim();
    nextPath = sanitizeNextPath(String(form.get("next") ?? ""));
  }

  if (!accessToken || !refreshToken || !nextPath) {
    return new NextResponse("Invalid print session payload.", { status: 400 });
  }

  const { url, anonKey } = getPublicSupabaseConfig();
  const probe = createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const {
    data: { user },
    error,
  } = await probe.auth.getUser(accessToken);

  if (error || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const redirectUrl = new URL(nextPath, request.nextUrl.origin);
  const response = NextResponse.redirect(redirectUrl, 303);

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return new NextResponse("Unable to establish print session.", { status: 401 });
  }

  return response;
}
