import type { Metadata, Viewport } from "next";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import Header from "@/components/Header";
import "./globals.css";

/** Eski HTML kabuğunun CDN/tarayıcıda uzun süre takılı kalmasını azaltır */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export const metadata: Metadata = {
  title: "Nakits",
  description: "Nakits — ilan platformu (MVP)."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <FavoritesProvider>
          <Header />
          {children}
        </FavoritesProvider>
      </body>
    </html>
  );
}
