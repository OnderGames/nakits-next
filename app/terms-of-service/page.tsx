import LegalHtmlBody from "@/components/legal/LegalHtmlBody";
import TermsOfServiceBody from "@/components/legal/TermsOfServiceBody";
import { getLegalPage, legalPageMetadata } from "@/lib/legal-pages";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("terms-of-service");
}

export default async function TermsOfServiceEnPage() {
  const row = await getLegalPage("terms-of-service");

  return (
    <main className="container">
      <p style={{ marginBottom: 16 }}>
        <Link href="/register" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          ← Back to registration
        </Link>
        {" · "}
        <Link href="/uyelik-sozlesmesi" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          Türkçe metin
        </Link>
      </p>
      <article className="panel legal-static-article" style={{ maxWidth: 720, lineHeight: 1.65 }}>
        {row ? <LegalHtmlBody html={row.body_html} /> : <TermsOfServiceBody />}
      </article>
    </main>
  );
}
