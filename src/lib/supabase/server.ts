import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

import type { Database } from "@/types/database";
import { getPublicSupabaseConfig } from "@/lib/supabase/env";

type CookieStore = {
  getAll: () => {
    name: string;
    value: string;
  }[];
  setAll: (
    cookies: {
      name: string;
      value: string;
      options: CookieOptions;
    }[],
  ) => void;
};

export function createSupabaseServerClient(cookieStore: CookieStore) {
  const { url, anonKey } = getPublicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies) {
        cookieStore.setAll(cookies);
      },
    },
  });
}

export const getSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();

  return createSupabaseServerClient({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Server Components may not be able to mutate cookies.
      }
    },
  });
});
