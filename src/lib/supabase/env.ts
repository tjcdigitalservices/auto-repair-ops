function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getPublicSupabaseConfig() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey =
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase environment variables in .env.local: ${missing.join(", ")}. ` +
        "Copy them from Supabase Dashboard -> Project Settings -> API, then restart the dev server.",
    );
  }

  return { url: url!, anonKey: anonKey! };
}

export function getSupabaseAdminConfig() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase admin environment variables in .env.local: ${missing.join(", ")}.`,
    );
  }

  return { url: url!, serviceRoleKey: serviceRoleKey! };
}
