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

export function createSupabaseAdminClient() {
  return createClient(
    process.env.SUPABASE_URL ?? requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    serverOptions,
  );
}
