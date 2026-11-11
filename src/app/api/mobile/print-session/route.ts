import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { buildSupabaseAuthCookieHeader } from "@/lib/reports/pdf-auth";
import { getPublicSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getProjectRef(supabaseUrl: string) {
  return supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] ?? "supabase";
}

function readJwtExpiry(accessToken: string): number | undefined {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return undefined;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof json.exp === "number" ? json.exp : undefined;
  } catch {
    return undefined;
  }
}

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
 * Mobile WebView bridge: accept a bearer session, set Supabase SSR cookies, redirect to print.
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
  const supabase = createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const expiresAt = readJwtExpiry(accessToken);
  const storageKey = `sb-${getProjectRef(url)}-auth-token`;
  const cookieHeader = buildSupabaseAuthCookieHeader(storageKey, {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    expires_in: expiresAt ? Math.max(expiresAt - Math.floor(Date.now() / 1000), 0) : undefined,
    token_type: "bearer",
    user,
  });

  const redirectUrl = new URL(nextPath, request.nextUrl.origin);
  const response = NextResponse.redirect(redirectUrl, 303);

  for (const part of cookieHeader.split("; ")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq);
    const value = part.slice(eq + 1);
    response.cookies.set(name, value, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}
