import LegalHtmlBody from "@/components/legal/LegalHtmlBody";
import YasakliUrunlerBody from "@/components/legal/YasakliUrunlerBody";
import { getLegalPage, legalPageMetadata } from "@/lib/legal-pages";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("yasakli-urunler");
}

export default async function YasakliUrunlerPage() {
  const row = await getLegalPage("yasakli-urunler");

  return (
    <main className="container">
      <p style={{ marginBottom: 16 }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          ← Ana sayfaya dön
        </Link>
      </p>
      <article className="panel legal-static-article" style={{ maxWidth: 720, lineHeight: 1.65 }}>
        {row ? <LegalHtmlBody html={row.body_html} /> : <YasakliUrunlerBody />}
      </article>
    </main>
  );
}
