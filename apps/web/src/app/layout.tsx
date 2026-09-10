import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { firm } from "@/content/firm";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DisclaimerGate } from "@/components/disclaimer-gate";
import { CookieBanner } from "@/components/cookie-banner";
import { HideOnRoutes } from "@/components/hide-on-routes";
import { siteUrl } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const serifDisplay = Source_Serif_4({
  variable: "--font-serif-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${firm.name} — ${firm.tagline}`,
    template: `%s | ${firm.name}`,
  },
  description: firm.descriptor,
  openGraph: {
    siteName: firm.name,
    title: `${firm.name} — ${firm.tagline}`,
    description: firm.descriptor,
    type: "website",
    locale: "en_IN",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#28283c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${inter.variable} ${serifDisplay.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[110] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>

        {/* `/notice` stands alone — no nav, no firm information. */}
        <HideOnRoutes routes={["/notice"]}>
          <SiteHeader />
        </HideOnRoutes>
        <main id="main" className="flex-1">
          {children}
        </main>
        <HideOnRoutes routes={["/notice"]}>
          <SiteFooter />
        </HideOnRoutes>

        {/* Bar Council of India gate, then granular cookie consent. */}
        <DisclaimerGate />
        <CookieBanner />
      </body>
    </html>
  );
}
