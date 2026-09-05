import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { hasCapability, type AppCapability } from "@/lib/auth/permissions";
import { isTenantOperable } from "@/lib/tenants/status";
import type { Database } from "@/types/database";
import { getPublicSupabaseConfig } from "@/lib/supabase/env";

export type PdfAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user: User | unknown;
};

export type BearerPdfAuth = {
  supabase: SupabaseClient<Database>;
  session: PdfAuthSession;
  cookieHeader: string;
  storageKey: string;
};

type PackedSessionPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user?: unknown;
};

function getProjectRef(supabaseUrl: string) {
  return supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] ?? "supabase";
}

function readJwtExpiry(accessToken: string): number | undefined {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) {
      return undefined;
    }
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof json.exp === "number" ? json.exp : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build the same base64url cookie encoding @supabase/ssr uses, so Next SSR
 * print pages authenticate when Puppeteer loads them.
 */
export function buildSupabaseAuthCookieHeader(
  storageKey: string,
  session: PdfAuthSession,
): string {
  const raw = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type ?? "bearer",
    user: session.user,
  });
  const encoded = `base64-${stringToBase64URL(raw)}`;
  const chunks = createChunks(storageKey, encoded);
  return chunks.map((chunk) => `${chunk.name}=${chunk.value}`).join("; ");
}

export function getBearerAccessToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token || null;
}

export function getBearerRefreshToken(request: NextRequest): string | null {
  const token = request.headers.get("x-supabase-refresh-token")?.trim();
  return token || null;
}

export function parsePackedSupabaseSession(
  request: NextRequest,
): { accessToken: string; refreshToken: string; expiresAt?: number; user?: unknown } | null {
  const packed = request.headers.get("x-supabase-session")?.trim();
  if (!packed) {
    return null;
  }

  try {
    const json = Buffer.from(packed, "base64url").toString("utf8");
    const payload = JSON.parse(json) as PackedSessionPayload;
    const accessToken = payload.access_token?.trim();
    const refreshToken = payload.refresh_token?.trim();
    if (!accessToken || !refreshToken) {
      return null;
    }
    return {
      accessToken,
      refreshToken,
      expiresAt: typeof payload.expires_at === "number" ? payload.expires_at : undefined,
      user: payload.user,
    };
  } catch {
    return null;
  }
}

/** True when the client attempted mobile/API Bearer-style auth. */
export function isBearerPdfAuthAttempted(request: NextRequest): boolean {
  return Boolean(
    getBearerAccessToken(request) ||
      request.headers.get("x-supabase-session")?.trim() ||
      getBearerRefreshToken(request),
  );
}

/**
 * Prefer loopback for Puppeteer when the API was hit via a LAN IP — Chrome on
 * the same machine is more reliable against 127.0.0.1 than a changing NIC IP.
 */
export function resolvePdfInternalOrigin(request: NextRequest): string {
  const configured =
    process.env.PDF_INTERNAL_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const origin = request.nextUrl.origin;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const isPrivateLan =
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    if (isPrivateLan || host === "0.0.0.0") {
      const port = url.port || (url.protocol === "https:" ? "443" : "80");
      const defaultHttp = url.protocol === "http:" && port === "80";
      const defaultHttps = url.protocol === "https:" && port === "443";
      const portPart = defaultHttp || defaultHttps ? "" : `:${port}`;
      return `${url.protocol}//127.0.0.1${portPart}`;
    }
  } catch {
    // Fall through to request origin.
  }

  return origin;
}

/**
 * Resolve a mobile Bearer session into a Supabase client plus cookie/localStorage
 * material Puppeteer can use to load SSR print pages.
 */
export async function resolveBearerPdfAuth(
  request: NextRequest,
): Promise<BearerPdfAuth | null> {
  const packed = parsePackedSupabaseSession(request);
  const accessToken = packed?.accessToken ?? getBearerAccessToken(request);
  const refreshToken = packed?.refreshToken ?? getBearerRefreshToken(request);

  if (!accessToken || !refreshToken) {
    return null;
  }

  const { url, anonKey } = getPublicSupabaseConfig();
  const storageKey = `sb-${getProjectRef(url)}-auth-token`;

  const supabase = createClient<Database>(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  const expiresAt = packed?.expiresAt ?? readJwtExpiry(accessToken);
  const session: PdfAuthSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    expires_in: expiresAt ? Math.max(expiresAt - Math.floor(Date.now() / 1000), 0) : undefined,
    token_type: "bearer",
    user,
  };

  const cookieHeader = buildSupabaseAuthCookieHeader(storageKey, session);
  if (!cookieHeader) {
    return null;
  }

  return {
    supabase,
    session,
    cookieHeader,
    storageKey,
  };
}

export async function assertBearerStaffCapability(
  supabase: SupabaseClient<Database>,
  capability: AppCapability,
): Promise<boolean> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (platformAdmin) {
    return true;
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("role, status, tenant_id")
    .eq("linked_user_id", user.id)
    .maybeSingle();

  if (!staff || staff.status !== "active") {
    return false;
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("status")
    .eq("id", staff.tenant_id)
    .maybeSingle();

  if (!tenant || !isTenantOperable(tenant.status)) {
    return false;
  }

  return hasCapability(staff.role, capability);
}
