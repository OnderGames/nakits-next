import GizlilikPolitikasiBody from "@/components/legal/GizlilikPolitikasiBody";
import LegalHtmlBody from "@/components/legal/LegalHtmlBody";
import { getLegalPage, legalPageMetadata } from "@/lib/legal-pages";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("gizlilik-politikasi");
}

export default async function PrivacyPolicyPage() {
  const row = await getLegalPage("gizlilik-politikasi");

  return (
    <main className="container">
      <p style={{ marginBottom: 16 }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          ← Ana sayfaya dön
        </Link>
      </p>
      <article className="panel legal-static-article" style={{ maxWidth: 720, lineHeight: 1.65 }}>
        {row ? <LegalHtmlBody html={row.body_html} /> : <GizlilikPolitikasiBody />}
      </article>
    </main>
  );
}
