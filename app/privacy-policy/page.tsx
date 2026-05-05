import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy and KVKK notice (English)",
  description:
    "How Nakits.com processes personal data, legal bases, your rights, cookies, and security."
};

export default function PrivacyPolicyEnPage() {
  return (
    <main className="container">
      <p style={{ marginBottom: 16 }}>
        <Link
          href="/"
          style={{ color: "var(--primary)", textDecoration: "underline" }}
        >
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
      <article
        className="panel"
        style={{ maxWidth: 720, lineHeight: 1.65 }}
      >
        <h1 className="section-title" style={{ marginTop: 0 }}>
          Privacy Policy and KVKK Notice
        </h1>
        <p className="meta" style={{ marginTop: 8, marginBottom: 0 }}>
          Last updated: 6 May 2026
        </p>
        <p className="meta" style={{ marginTop: 8, marginBottom: 0 }}>
          This page is an English translation of the Turkish disclosure required
          under Law No. 6698 on the Protection of Personal Data (“KVKK”). If
          there is any conflict, the Turkish version at{" "}
          <Link
            href="/gizlilik-politikasi"
            style={{ color: "var(--primary)", textDecoration: "underline" }}
          >
            /gizlilik-politikasi
          </Link>{" "}
          prevails.
        </p>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Purpose and scope</h2>
          <p>
            This document explains how your personal data is processed within
            the Nakits.com classifieds platform (the “Platform”) in line with
            KVKK, and describes our privacy practices.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>2. Data controller</h2>
          <p>
            The data controller under KVKK is the legal entity or natural person
            operating the Nakits.com service. You may submit data subject
            requests together with information sufficient to verify your
            identity through the official contact channels published on the
            Platform. If contact details change, they will be announced on this
            page.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            3. Categories of personal data processed
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Identity and contact:</strong> name and surname or
              business name, email address, phone number; other information you
              include in your profile or listing content.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Account and transactions:</strong> membership data,
              listing text and images, favourites, messaging content,
              moderation and support records.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Technical and usage:</strong> IP address, device and
              browser information, session and security logs, and data collected
              via cookies and similar technologies.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            4. Purposes of processing
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Creating membership, authentication, and managing your account.
            </li>
            <li style={{ marginBottom: 8 }}>
              Publishing listings and providing search and showcase features.
            </li>
            <li style={{ marginBottom: 8 }}>
              Enabling communication between buyers and sellers through the
              Platform.
            </li>
            <li style={{ marginBottom: 8 }}>
              Security, fraud and abuse prevention; fulfilling legal
              obligations.
            </li>
            <li style={{ marginBottom: 8 }}>
              Improving service quality, fixing errors, and statistical analysis
              (using anonymised or aggregated data where possible).
            </li>
            <li style={{ marginBottom: 8 }}>
              Providing information to public authorities and defending legal
              claims.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>5. Legal bases</h2>
          <p>
            Processing is based on the grounds set out in Articles 5 and 6 of
            KVKK, such as explicit consent, performance or conclusion of a
            contract, legitimate interests of the controller, compliance with a
            legal obligation, or processing expressly permitted by law. The
            applicable ground depends on the specific processing activity.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>6. Transfers</h2>
          <p>
            Service providers (for example cloud/hosting and authentication
            providers) may be used for hosting the Platform and database
            operations. In that context, your data may be transferred within
            Turkey or abroad to the extent required for the service and subject
            to contractual safeguards and KVKK-compliant transfer mechanisms.
            Data may be disclosed to public institutions where required by law.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>7. Retention</h2>
          <p>
            Personal data are stored for as long as necessary for the purposes
            for which they are processed. Account and listing data are deleted,
            destroyed, or anonymised when active use ends or when statutory
            limitation or audit requirements no longer apply; retention periods
            follow applicable law and operational needs.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            8. Your rights under KVKK
          </h2>
          <p style={{ marginBottom: 12 }}>
            As a data subject, under Article 11 of KVKK you have the right to:
          </p>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Learn whether your personal data are processed,
            </li>
            <li style={{ marginBottom: 8 }}>
              Request information if processed, and learn whether they are used
              for the intended purpose,
            </li>
            <li style={{ marginBottom: 8 }}>
              Know third parties to whom data are transferred (if any),
            </li>
            <li style={{ marginBottom: 8 }}>
              Request rectification if processed incompletely or inaccurately,
            </li>
            <li style={{ marginBottom: 8 }}>
              Request erasure or destruction within the conditions set out in
              law,
            </li>
            <li style={{ marginBottom: 8 }}>
              Request notification of such actions to third parties to whom data
              were transferred,
            </li>
            <li style={{ marginBottom: 8 }}>
              Object to a result adverse to you arising solely from automated
              analysis,
            </li>
            <li style={{ marginBottom: 8 }}>
              Request compensation for damage stemming from unlawful processing,
            </li>
          </ul>
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            You may submit requests to the data controller. We respond within
            the statutory timeframe. If you are dissatisfied with the outcome,
            you may lodge a complaint with the Turkish Personal Data Protection
            Board (
            <a
              href="https://www.kvkk.gov.tr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)" }}
            >
              kvkk.gov.tr
            </a>
            ).
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>9. Security</h2>
          <p>
            We apply appropriate technical and organisational measures to
            protect the confidentiality and integrity of personal data.
            Transmission over the internet is never 100% secure; please use a
            strong password and do not share your account credentials.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>10. Cookies</h2>
          <p>
            Cookies and local storage may be used to manage your session and
            preferences. You can restrict cookies via your browser; some
            Platform features may then work only in a limited way.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>11. Changes</h2>
          <p>
            This policy may be updated. Material changes will be communicated on
            the Platform where feasible; checking the “last updated” date on
            this page is sufficient.
          </p>
          <p style={{ marginTop: 16 }}>
            Related:{" "}
            <Link
              href="/terms-of-service"
              style={{ color: "var(--primary)", textDecoration: "underline" }}
            >
              Terms of Service
            </Link>
          </p>
        </section>
      </article>
    </main>
  );
}
