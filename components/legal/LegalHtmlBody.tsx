import { sanitizeLegalHtml } from "@/lib/legal-pages";

export default function LegalHtmlBody({ html }: { html: string }) {
  return (
    <div
      className="legal-page-dynamic"
      dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(html) }}
    />
  );
}
