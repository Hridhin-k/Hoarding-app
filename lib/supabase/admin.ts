import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, requireServiceRoleKey } from "@/lib/env";

export function createAdminClient() {
  const env = getPublicEnv();
  const serviceRoleKey = requireServiceRoleKey();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
