import type { Metadata } from "next";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

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
        <Header />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
