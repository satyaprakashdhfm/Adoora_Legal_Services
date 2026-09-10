import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { footerNav } from "@/lib/nav";
import { firm, offices } from "@/content/firm";
import { footerDisclaimer } from "@/content/legal";

/** 14×14 stroke icons for the contact lines. */
function FooterIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gold">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const icons = {
  pin: "M7 1.6c2 0 3.6 1.6 3.6 3.6 0 2.6-3.6 7.2-3.6 7.2S3.4 7.8 3.4 5.2C3.4 3.2 5 1.6 7 1.6zM7 6.6a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8z",
  phone:
    "M2.6 2.2h2l.9 2.2-1.2.9a6.6 6.6 0 003.4 3.4l.9-1.2 2.2.9v2a.9.9 0 01-1 .9A9.3 9.3 0 011.7 3.2a.9.9 0 01.9-1z",
  mail: "M1.8 3.2h10.4v7.6H1.8zM1.8 3.6L7 7.4l5.2-3.8",
} as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-white/70">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Wordmark tone="dark" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed">
              {firm.descriptor}
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <a
                href={firm.phoneHref}
                className="flex items-center gap-2.5 transition hover:text-gold-bright"
              >
                <FooterIcon path={icons.phone} />
                {firm.phone}
              </a>
              <a
                href={firm.emailHref}
                className="flex items-center gap-2.5 transition hover:text-gold-bright"
              >
                <FooterIcon path={icons.mail} />
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

        <div className="mt-14 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {offices.map((office) => (
            <div key={office.city}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <FooterIcon path={icons.pin} />
                {office.city}
              </h3>
              <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-gold-bright/70">
                {office.label}
              </p>
              <address className="mt-3 space-y-0.5 text-sm not-italic">
                {office.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </address>
            </div>
          ))}

          {firm.linkedin && (
            <div>
              <h3 className="text-sm font-semibold text-white">Follow us</h3>
              <a
                href={firm.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 transition hover:border-gold hover:text-gold-bright"
              >
                <span className="sr-only">{firm.name} on LinkedIn</span>
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                  <path d="M4.6 7.4h2.7V17H4.6zM5.95 3a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zM9.2 7.4h2.6v1.3h.04c.36-.66 1.24-1.36 2.56-1.36 2.74 0 3.25 1.7 3.25 3.9V17h-2.7v-4.24c0-1.01-.02-2.31-1.45-2.31-1.45 0-1.67 1.1-1.67 2.24V17H9.2z" />
                </svg>
              </a>
            </div>
          )}
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
          <p className="flex items-center gap-3 font-serif italic text-white/50">
            <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
            {firm.signOff}
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
