import type { SupabaseClient } from "@supabase/supabase-js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Karşı tarafa isteğe bağlı Resend e-postası (profilde e-posta varsa). */
export async function notifyRecipientByEmail(
  sb: SupabaseClient,
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
