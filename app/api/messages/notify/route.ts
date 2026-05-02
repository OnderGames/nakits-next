import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { notifyRecipientByEmail } from "@/lib/message-notify-email";

/**
 * İstemci doğrudan mesajı DB'ye yazdıktan sonra isteğe bağlı e-posta bildirimi.
 * Katılımcı doğrulaması yapılır (mesaj içeriği sunucuda tekrar kontrol edilmez).
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json(
      { error: "Sunucu yapılandırması eksik." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const sb = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const {
    data: { user },
    error: userErr
  } = await sb.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const conversationId = (json as { conversationId?: string }).conversationId;
  const preview = String((json as { preview?: string }).preview ?? "").trim();

  if (!conversationId || !preview) {
    return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
  }

  const { data: conv, error: cErr } = await sb
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (cErr || !conv) {
    return NextResponse.json({ error: "Konuşma bulunamadı." }, { status: 404 });
  }

  const row = conv as { buyer_id: string; seller_id: string };
  if (user.id !== row.buyer_id && user.id !== row.seller_id) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  try {
    await notifyRecipientByEmail(sb, user.id, conversationId, preview);
  } catch {
    /* e-posta isteğe bağlı */
  }

  return NextResponse.json({ ok: true });
}
