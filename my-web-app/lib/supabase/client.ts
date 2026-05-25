import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import ws from "ws";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const serverOptions: SupabaseClientOptions<"public"> = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: ws as unknown as NonNullable<
      NonNullable<SupabaseClientOptions<"public">["realtime"]>["transport"]
    >,
  },
};

export function createSupabaseServerClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serverOptions,
  );
}

export function createSupabaseAdminClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    serverOptions,
  );
}
