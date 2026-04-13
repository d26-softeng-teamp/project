import { createClient } from "@supabase/supabase-js";

function requireSupabaseEnv(url: string | undefined, key: string | undefined, keyName: string) {
  const u = url?.trim();
  const k = key?.trim();
  if (!u || !k) {
    throw new Error(
      `Missing or empty Supabase env on the API process: need SUPABASE_URL and ${keyName}. ` +
        `These are server-only (not VITE_*). Set them on the same host/service that runs apps/api, then redeploy/restart.`,
    );
  }
  return [u, k] as const;
}

export function createSupabaseClient() {
  const [url, key] = requireSupabaseEnv(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    "SUPABASE_ANON_KEY",
  );
  return createClient(url, key);
}

export function createSupabaseAdmin() {
  const [url, key] = requireSupabaseEnv(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  return createClient(url, key);
}
