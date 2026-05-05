import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import Header from "@/components/Header";
import MessagesPeekDock from "@/components/MessagesPeekDock";
import SiteFooter from "@/components/SiteFooter";
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
  title: {
    default: "Nakits.com — ikinci el ve sıfır ilan vitrini",
    template: "%s | Nakits.com"
  },
  description:
    "Türkiye genelinde ikinci el ve sıfır ürün ilanları; vitrin ilanları, şehir ve ilçe filtreleri.",
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
          <SiteFooter />
          <MessagesPeekDock />
        </FavoritesProvider>
      </body>
    </html>
  );
}
