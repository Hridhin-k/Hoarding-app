import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { expireStaleAuthCookies } from "@/lib/supabase/auth-cookies";
import { getPublicEnv, hasPublicEnv } from "@/lib/env";

export function isSupabaseConfigured() {
  return hasPublicEnv();
}

export async function createClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          const kept = new Set(cookiesToSet.map((cookie) => cookie.name));
          expireStaleAuthCookies(cookieStore.getAll(), kept, (name) => cookieStore.delete(name));
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — proxy refreshes the session.
        }
      },
    },
  });
}
