import LegalHtmlBody from "@/components/legal/LegalHtmlBody";
import PrivacyPolicyBody from "@/components/legal/PrivacyPolicyBody";
import { getLegalPage, legalPageMetadata } from "@/lib/legal-pages";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return legalPageMetadata("privacy-policy");
}

export default async function PrivacyPolicyEnPage() {
  const row = await getLegalPage("privacy-policy");

  return (
    <main className="container">
      <p style={{ marginBottom: 16 }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          ← Back to home
        </Link>
        {" · "}
        <Link
          href="/gizlilik-politikasi"
          style={{ color: "var(--primary)", textDecoration: "underline" }}
        >
          Türkçe metin
        </Link>
      </p>
      <article className="panel legal-static-article" style={{ maxWidth: 720, lineHeight: 1.65 }}>
        {row ? <LegalHtmlBody html={row.body_html} /> : <PrivacyPolicyBody />}
      </article>
    </main>
  );
}
