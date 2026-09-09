import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { footerNav } from "@/lib/nav";
import { firm, offices } from "@/content/firm";
import { footerDisclaimer } from "@/content/legal";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-white/70">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Wordmark tone="dark" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed">
              {firm.descriptor}
            </p>
            <div className="mt-6 flex flex-col gap-1.5 text-sm">
              <a
                href={firm.phoneHref}
                className="transition hover:text-gold-bright"
              >
                {firm.phone}
              </a>
              <a
                href={firm.emailHref}
                className="transition hover:text-gold-bright"
              >
                {firm.email}
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerNav.map((column) => (
              <div key={column.heading}>
                <h2 className="eyebrow text-gold-bright/80">{column.heading}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
          {offices.map((office) => (
            <div key={office.city}>
              <h3 className="text-sm font-semibold text-white">
                {office.city}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gold-bright/70">
                {office.label}
              </p>
              <address className="mt-3 space-y-0.5 text-sm not-italic">
                {office.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </address>
            </div>
          ))}
        </div>

        {/* BCI disclaimer — required on every page. */}
        <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="eyebrow text-gold-bright/80">Disclaimer</h2>
          <p className="mt-3 text-xs leading-relaxed text-white/60">
            {footerDisclaimer}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {firm.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="transition hover:text-white">
              Cookie Policy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms of Use
            </Link>
            <Link href="/sitemap.xml" className="transition hover:text-white">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
