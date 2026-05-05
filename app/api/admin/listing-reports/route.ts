import {
  getServiceRoleClient,
  getServiceRoleMissingMessage,
  verifyModerationStaff
} from "@/lib/admin-auth";
import { LISTING_REPORT_REASON_LABELS } from "@/lib/listing-report-reasons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const v = await verifyModerationStaff(request);
  if (!v.ok) {
    return Response.json({ error: v.message }, { status: v.status });
  }

  const adminSb = getServiceRoleClient();
  if (!adminSb) {
    return Response.json({ error: getServiceRoleMissingMessage() }, { status: 503 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") ?? "open";
  const allowed = new Set(["all", "open", "reviewed", "dismissed"]);
  const sf = allowed.has(statusFilter) ? statusFilter : "open";

  let query = adminSb.from("listing_reports").select(
    `
      id,
      listing_id,
      reporter_id,
      reason_key,
      details,
      status,
      created_at,
      reviewed_at,
      listings (
        title,
        listing_code,
        status,
        seller_id
      ),
      reporter:profiles!listing_reports_reporter_id_fkey (
        email,
        full_name,
        public_code
      )
    `,
    { count: "exact" }
  );

  if (sf !== "all") {
    query = query.eq("status", sf);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  type ListingEmbed = {
    title: string;
    listing_code: string;
    status: string;
    seller_id: string;
  };

  type ReporterEmbed = {
    email: string | null;
    full_name: string | null;
    public_code: string | null;
  };

  type RawRow = {
    id: string;
    listing_id: string;
    reporter_id: string;
    reason_key: string;
    details: string;
    status: string;
    created_at: string;
    reviewed_at: string | null;
    listings: ListingEmbed | ListingEmbed[] | null;
    reporter: ReporterEmbed | ReporterEmbed[] | null;
  };

  function oneListing(embed: RawRow["listings"]): ListingEmbed | null {
    if (embed == null) return null;
    return Array.isArray(embed) ? embed[0] ?? null : embed;
  }

  function oneReporter(embed: RawRow["reporter"]): ReporterEmbed | null {
    if (embed == null) return null;
    return Array.isArray(embed) ? embed[0] ?? null : embed;
  }

  const rawRows = (data ?? []) as RawRow[];

  const sellerIds = [
    ...new Set(
      rawRows
        .map((r) => oneListing(r.listings)?.seller_id)
        .filter((x): x is string => Boolean(x))
    )
  ];

  const sellerMap = new Map<
    string,
    { email: string; full_name: string | null; public_code: string | null }
  >();
  if (sellerIds.length > 0) {
    const { data: sellers, error: sErr } = await adminSb
      .from("profiles")
      .select("id, email, full_name, public_code")
      .in("id", sellerIds);
    if (!sErr && sellers) {
      for (const p of sellers as {
        id: string;
        email: string;
        full_name: string | null;
        public_code: string | null;
      }[]) {
        sellerMap.set(p.id, {
          email: p.email ?? "",
          full_name: p.full_name,
          public_code: p.public_code
        });
      }
    }
  }

  const { count: openCount, error: cErr } = await adminSb
    .from("listing_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  const reports = rawRows.map((r) => {
    const lid = oneListing(r.listings);
    const rep = oneReporter(r.reporter);
    const sid = lid?.seller_id ?? "";
    const seller = sellerMap.get(sid);
    const reasonLabel =
      LISTING_REPORT_REASON_LABELS[
        r.reason_key as keyof typeof LISTING_REPORT_REASON_LABELS
      ] ?? r.reason_key;
    return {
      id: r.id,
      listingId: r.listing_id,
      reasonKey: r.reason_key,
      reasonLabel,
      details: r.details ?? "",
      status: r.status,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
      listingTitle: lid?.title ?? "",
      listingCode: lid?.listing_code ?? "",
      listingStatus: lid?.status ?? "",
      sellerId: sid,
      sellerEmail: seller?.email ?? "",
      sellerName: seller?.full_name?.trim() || "",
      sellerPublicCode: seller?.public_code ?? "",
      reporterEmail: rep?.email ?? "",
      reporterName: rep?.full_name?.trim() || "",
      reporterPublicCode: rep?.public_code ?? ""
    };
  });

  return Response.json({
    reports,
    total: count ?? reports.length,
    openCount: cErr ? 0 : openCount ?? 0
  });
}
