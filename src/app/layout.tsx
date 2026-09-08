import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { firm } from "@/lib/content";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${firm.name} — Coming Soon`,
  description: `${firm.tagline}. Our new website is coming soon — reach us at ${firm.phone} or ${firm.email}.`,
  openGraph: {
    title: `${firm.name} — Coming Soon`,
    description: `${firm.tagline}. Our new website is coming soon.`,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0f12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">{children}</body>
    </html>
  );
}
