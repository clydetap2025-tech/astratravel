import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type Supabase = SupabaseClient<Database>;
let client: Supabase | null = null;

/**
 * The browser's Supabase client, made once from the public URL and anon key that /api/session hands out.
 * Only the anon key reaches the browser; Row Level Security decides what it may read and write.
 */
export function startSupabase(config: { url: string; anonKey: string }): Supabase {
  if (client) return client;
  client = createClient<Database>(config.url, config.anonKey, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "astratravel.auth" },
  });
  return client;
}

export const supabaseClient = () => client;

/** The access token of the signed-in user, for our own /api calls. */
export async function accessToken(): Promise<string | null> {
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Supabase and PostgREST errors as our message keys (see data/i18n-account.js). */
export function errorKey(error: unknown): string {
  const text = String((error as { message?: string; code?: string })?.message ?? error ?? "").toLowerCase();
  const code = String((error as { code?: string })?.code ?? "");
  if (code === "invalid_credentials" || text.includes("invalid login credentials")) return "authBadLogin";
  if (code === "email_not_confirmed" || text.includes("email not confirmed")) return "authNotConfirmed";
  if (code === "user_already_exists" || text.includes("already registered")) return "authExists";
  if (code === "weak_password" || text.includes("password should")) return "authWeakPassword";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || text.includes("rate limit") || text.includes("too many")) return "authRateLimit";
  if (text.includes("registration_closed") || code === "signup_disabled") return "authRegistrationClosed";
  if (code === "validation_failed" || text.includes("invalid email") || text.includes("unable to validate email")) return "authBadEmail";
  if (text.includes("same_password") || code === "same_password") return "authSamePassword";
  if (text.includes("failed to fetch") || text.includes("network")) return "authNetwork";
  for (const key of ["ai_daily_limit", "account_blocked", "ai_disabled", "too_many", "forbidden", "unauthorized"]) if (text.includes(key)) return key;
  return "request_error";
}
