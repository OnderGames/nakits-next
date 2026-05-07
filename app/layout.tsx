import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import Header from "@/components/Header";
import HomeCategoryDrawer from "@/components/HomeCategoryDrawer";
import MobileBottomNav from "@/components/MobileBottomNav";
import MessagesPeekDock from "@/components/MessagesPeekDock";
import SiteFooter from "@/components/SiteFooter";
import { getSiteOrigin } from "@/lib/site-url";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--font-inter"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
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
          <MobileBottomNav />
          <HomeCategoryDrawer />
          <MessagesPeekDock />
        </FavoritesProvider>
      </body>
    </html>
  );
}
