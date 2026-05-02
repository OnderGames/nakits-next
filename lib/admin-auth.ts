import { createClient } from "@supabase/supabase-js";

/** Virgülle ayrılmış, küçük harf karşılaştırılır */
export function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export type AdminVerifyResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; message: string };

export async function verifyAdminFromRequest(
  request: Request
): Promise<AdminVerifyResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Oturum gerekli." };
  }
  const token = authHeader.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { ok: false, status: 500, message: "Sunucu yapılandırması eksik." };
  }

  const sb = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const {
    data: { user },
    error
  } = await sb.auth.getUser();
  if (error || !user?.email) {
    return { ok: false, status: 401, message: "Geçersiz oturum." };
  }
  const admins = parseAdminEmails();
  const email = user.email.toLowerCase();
  if (!admins.has(email)) {
    return { ok: false, status: 403, message: "Bu işlem için yetkiniz yok." };
  }
  return { ok: true, userId: user.id, email };
}

export function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
