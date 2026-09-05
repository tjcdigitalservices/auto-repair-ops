import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { getPublicSupabaseConfig } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getPublicSupabaseConfig();

  return createBrowserClient<Database>(url, anonKey);
}
