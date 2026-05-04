import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import Header from "@/components/Header";
import MessagesPeekDock from "@/components/MessagesPeekDock";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-inter"
});

/** Eski HTML kabuğunun CDN/tarayıcıda uzun süre takılı kalmasını azaltır */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.nakits.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Nakits",
  description: "Nakits — ilan platformu (MVP).",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={fontSans.variable}>
      <body className={fontSans.className}>
        <FavoritesProvider>
          <Header />
          {children}
          <MessagesPeekDock />
        </FavoritesProvider>
      </body>
    </html>
  );
}
