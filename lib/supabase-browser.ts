"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!hasSupabaseConfig) return null;
  if (typeof window === "undefined") return null;
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true
        }
      }
    );
  }
  return browserClient;
}
