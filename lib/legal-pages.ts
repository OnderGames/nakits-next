import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

/** Yönetim panelinde düzenlenebilir metin sayfaları */
export const LEGAL_PAGE_SLUGS = [
  "uyelik-sozlesmesi",
  "gizlilik-politikasi",
  "terms-of-service",
  "privacy-policy",
  "yasakli-urunler"
] as const;

export type LegalPageSlug = (typeof LEGAL_PAGE_SLUGS)[number];

export function isLegalPageSlug(s: string): s is LegalPageSlug {
  return (LEGAL_PAGE_SLUGS as readonly string[]).includes(s);
}

export const LEGAL_PAGE_LABELS: Record<LegalPageSlug, string> = {
  "uyelik-sozlesmesi": "Üyelik sözleşmesi ve kullanım şartları (TR)",
  "gizlilik-politikasi": "Gizlilik politikası ve KVKK (TR)",
  "terms-of-service": "Terms of Service (EN)",
  "privacy-policy": "Privacy Policy (EN)",
  "yasakli-urunler": "Yasaklı ürün ve içerik listesi"
};

export type SiteLegalRow = {
  slug: LegalPageSlug;
  page_title: string;
  meta_description: string;
  body_html: string;
  updated_at: string;
};

/** Admin ve public taraf güvenlik için minimal HTML süzümü */
export function sanitizeLegalHtml(raw: string): string {
  let s = raw;
  s = s.replace(
    /<(?:script|iframe|object|embed|style)\b[^>]*>[\s\S]*?<\/(?:script|iframe|object|embed|style)>/gi,
    ""
  );
  s = s.replace(/<(?:script|iframe|object|embed|style)[^>]*\/?>/gi, "");
  s = s.replace(/javascript:/gi, "about:invalid/");
  s = s.replace(/\s(on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  return s;
}

/** Canlı içerik: body_html dolu satır döner */
export async function getLegalPage(
  slug: LegalPageSlug
): Promise<SiteLegalRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("site_legal_pages")
    .select("slug,page_title,meta_description,body_html,updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const body_html = typeof data.body_html === "string" ? data.body_html : "";
  if (!body_html.trim()) return null;

  return data as SiteLegalRow;
}

export const LEGAL_DEFAULT_METADATA: Record<LegalPageSlug, Metadata> = {
  "uyelik-sozlesmesi": {
    title: "Üyelik sözleşmesi ve kullanım şartları",
    description:
      "Nakits.com üyelik koşulları, kullanım kuralları, ücretlendirme ve uyuşmazlık çözümü."
  },
  "gizlilik-politikasi": {
    title: "Gizlilik politikası ve KVKK aydınlatma metni",
    description:
      "Nakits.com kişisel verilerin korunması, işlenme amaçları, haklarınız ve çerezler hakkında bilgilendirme."
  },
  "terms-of-service": {
    title: "Terms of Service (English)",
    description:
      "Nakits.com membership rules, acceptable use, fees, termination, governing law."
  },
  "privacy-policy": {
    title: "Privacy Policy and KVKK notice (English)",
    description:
      "How Nakits.com processes personal data, legal bases, your rights, cookies, and security."
  },
  "yasakli-urunler": {
    title: "Yasaklı ürün ve içerikler",
    description:
      "Nakits.com’da ilanı yasak veya kısıtlı ürün ve içeriklere ilişkin bilgilendirme."
  }
};

export async function legalPageMetadata(slug: LegalPageSlug): Promise<Metadata> {
  const fallback = LEGAL_DEFAULT_METADATA[slug];
  const row = await getLegalPage(slug);
  if (!row?.page_title?.trim()) return fallback;
  return {
    title: row.page_title.trim(),
    description:
      row.meta_description?.trim() ||
      (typeof fallback.description === "string" ? fallback.description : undefined)
  };
}
