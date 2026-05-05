import { createClient } from "@supabase/supabase-js";
import {
  getServiceRoleClient,
  getServiceRoleMissingMessage
} from "@/lib/admin-auth";
import {
  isListingReportReasonKey,
  type ListingReportReasonKey
} from "@/lib/listing-report-reasons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORTABLE_STATUSES = new Set(["active", "sold"]);

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }
  const token = authHeader.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return Response.json({ error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  const sb = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const {
    data: { user },
    error: userErr
  } = await sb.auth.getUser();
  if (userErr || !user?.id) {
    return Response.json({ error: "Geçersiz oturum." }, { status: 401 });
  }

  let body: {
    listingId?: string;
    reasonKey?: string;
    details?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const reasonRaw = typeof body.reasonKey === "string" ? body.reasonKey.trim() : "";
  const details =
    typeof body.details === "string" ? body.details.trim().slice(0, 2000) : "";

  if (!listingId) {
    return Response.json({ error: "İlan kimliği gerekli." }, { status: 400 });
  }
  if (!isListingReportReasonKey(reasonRaw)) {
    return Response.json({ error: "Geçersiz şikayet nedeni." }, { status: 400 });
  }
  const reasonKey = reasonRaw as ListingReportReasonKey;

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const { data: listing, error: lErr } = await adminSb
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", listingId)
    .maybeSingle();

  if (lErr) {
    return Response.json({ error: lErr.message }, { status: 500 });
  }
  if (!listing?.id) {
    return Response.json({ error: "İlan bulunamadı." }, { status: 404 });
  }

  const sellerId = listing.seller_id as string;
  const status = String(listing.status ?? "");

  if (sellerId === user.id) {
    return Response.json(
      { error: "Kendi ilanınızı şikayet edemezsiniz." },
      { status: 400 }
    );
  }

  if (!REPORTABLE_STATUSES.has(status)) {
    return Response.json(
      { error: "Bu ilan için şikayet oluşturulamaz." },
      { status: 400 }
    );
  }

  const { error: insErr } = await adminSb.from("listing_reports").insert({
    listing_id: listingId,
    reporter_id: user.id,
    reason_key: reasonKey,
    details
  });

  if (insErr) {
    const code = (insErr as { code?: string }).code;
    const msg = insErr.message ?? "";
    if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
      return Response.json(
        {
          error:
            "Bu ilan için zaten bekleyen bir şikayetiniz var. Moderasyon sonuçlanana kadar tekrar gönderilemez."
        },
        { status: 409 }
      );
    }
    return Response.json({ error: msg || "Şikayet kaydedilemedi." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
