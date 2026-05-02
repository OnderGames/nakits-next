import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function notifyRecipientByEmail(
  sb: ReturnType<typeof createClient>,
  senderId: string,
  conversationId: string,
  preview: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return;

  const { data: conv, error: cErr } = await sb
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (cErr || !conv) return;

  const row = conv as { buyer_id: string; seller_id: string };
  const recipientId =
    row.buyer_id === senderId ? row.seller_id : row.buyer_id;

  const { data: prof } = await sb
    .from("profiles")
    .select("email, full_name")
    .eq("id", recipientId)
    .maybeSingle();

  const email = (prof?.email as string | undefined)?.trim();
  if (!email) return;

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const link = site ? `${site}/mesajlar/${conversationId}` : "";
  const name = escapeHtml(
    ((prof?.full_name as string | undefined) ?? "").trim() || "Merhaba"
  );
  const snippet = escapeHtml(preview.slice(0, 500));

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Nakits — Yeni mesaj",
      html: `<p>${name},</p>
<p>Nakits üzerinde sana yeni bir mesaj var.</p>
<blockquote style="border-left:3px solid #e5e8f0;padding-left:12px;margin:16px 0">${snippet}</blockquote>
${
  link
    ? `<p><a href="${escapeHtml(link)}">Mesajı aç</a></p>`
    : `<p>Mobil uygulamadan veya siteden Mesajlar bölümüne gir.</p>`
}`
    })
  });
}

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
  const rawBody = (json as { body?: string }).body;
  const text = String(rawBody ?? "").trim();

  if (!conversationId || !text) {
    return NextResponse.json({ error: "Mesaj veya konuşma eksik." }, { status: 400 });
  }

  const { error: insErr } = await sb.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: text
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  try {
    await notifyRecipientByEmail(sb, user.id, conversationId, text);
  } catch {
    /* e-posta isteğe bağlı */
  }

  return NextResponse.json({ ok: true });
}
