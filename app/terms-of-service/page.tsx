import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service (English)",
  description:
    "Nakits.com membership rules, acceptable use, fees, termination, governing law."
};

export default function TermsOfServiceEnPage() {
  return (
    <main className="container">
      <p style={{ marginBottom: 16 }}>
        <Link
          href="/register"
          style={{ color: "var(--primary)", textDecoration: "underline" }}
        >
          ← Back to registration
        </Link>
        {" · "}
        <Link
          href="/uyelik-sozlesmesi"
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
          Nakits.com Membership Agreement and Terms of Service
        </h1>
        <p className="meta" style={{ marginTop: 8, marginBottom: 0 }}>
          Last updated: 6 May 2026
        </p>
        <p className="meta" style={{ marginTop: 8, marginBottom: 0 }}>
          This page is an English translation for convenience (including app
          store listings). If there is any conflict, the Turkish version at{" "}
          <Link
            href="/uyelik-sozlesmesi"
            style={{ color: "var(--primary)", textDecoration: "underline" }}
          >
            /uyelik-sozlesmesi
          </Link>{" "}
          prevails.
        </p>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>1. Parties</h2>
          <p>
            This agreement is concluded between the owner of the Nakits.com
            website (hereinafter “Nakits.com”) and the natural or legal person
            who registers as a member of the site (hereinafter the “Member”).
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>2. Subject matter</h2>
          <p>
            This agreement defines the conditions under which members may use
            the services offered through Nakits.com and sets out the rights and
            obligations of the parties.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            3. Membership requirements
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              The Member confirms that the information provided during
              registration is accurate and kept up to date.
            </li>
            <li style={{ marginBottom: 8 }}>
              The Member undertakes to use the site only for lawful purposes.
            </li>
            <li style={{ marginBottom: 8 }}>
              Persons under the age of 18 may not register as members.
            </li>
            <li style={{ marginBottom: 8 }}>
              Nakits.com may refuse membership applications or cancel
              memberships.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            4. Membership and acceptable use rules
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              When publishing listings, the Member must provide correct,
              complete, and current information.
            </li>
            <li style={{ marginBottom: 8 }}>
              The Member accepts legal and financial responsibility for actions
              taken through the site.
            </li>
            <li style={{ marginBottom: 8 }}>
              The Member must not use the site in a way that infringes the
              rights of third parties.
            </li>
            <li style={{ marginBottom: 8 }}>
              Listings for prohibited goods are strictly forbidden. Prohibited
              items include, without limitation: counterfeit or illegal goods;
              weapons, ammunition, explosives; drugs; tobacco, alcohol,
              gambling-related content; pornography; goods that infringe
              copyright; and any other goods that violate applicable
              regulations.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            5. Nakits.com rights and obligations
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Nakits.com may amend membership rules and site policies.
            </li>
            <li style={{ marginBottom: 8 }}>
              Nakits.com may moderate content posted by members and remove it
              where necessary.
            </li>
            <li style={{ marginBottom: 8 }}>
              Nakits.com protects members’ personal data in accordance with the{" "}
              <Link
                href="/privacy-policy"
                style={{ color: "var(--primary)", textDecoration: "underline" }}
              >
                Privacy Policy and KVKK notice
              </Link>
              .
            </li>
            <li style={{ marginBottom: 8 }}>
              Nakits.com implements appropriate technical measures to safeguard
              system security.
            </li>
            <li style={{ marginBottom: 8 }}>
              Nakits.com only provides a listing publication service; the seller
              is responsible for the accuracy of products or services, delivery,
              and payment arrangements. Nakits.com is not a party to those
              transactions.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            6. Fees and commission
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Nakits.com may charge fees or commission for certain services.
            </li>
            <li style={{ marginBottom: 8 }}>
              Pricing information is published separately on the site.
            </li>
            <li style={{ marginBottom: 8 }}>
              By using the site, the Member accepts such charges.
            </li>
            <li style={{ marginBottom: 8 }}>
              Payment and refund terms will be announced separately. Because
              Nakits.com only provides intermediary listing services, it is not
              responsible for the price of goods or services traded between
              users.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>7. Termination</h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              The Member may terminate membership at any time.
            </li>
            <li style={{ marginBottom: 8 }}>
              Nakits.com may terminate membership unilaterally if the Member
              breaches these rules.
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            8. Dispute resolution
          </h2>
          <ul style={{ paddingLeft: 22, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              Turkish law applies to disputes arising from this agreement.
            </li>
            <li style={{ marginBottom: 8 }}>
              The courts and enforcement offices of Adana shall have
              jurisdiction.
            </li>
            <li style={{ marginBottom: 8 }}>
              The parties agree to attempt mediation before initiating
              litigation.
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}
