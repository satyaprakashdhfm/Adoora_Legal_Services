import { SocialLinks } from "@/components/social-links";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { footerNav } from "@/lib/nav";
import { firm } from "@/content/firm";

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
  phone:
    "M2.6 2.2h2l.9 2.2-1.2.9a6.6 6.6 0 003.4 3.4l.9-1.2 2.2.9v2a.9.9 0 01-1 .9A9.3 9.3 0 011.7 3.2a.9.9 0 01.9-1z",
  mail: "M1.8 3.2h10.4v7.6H1.8zM1.8 3.6L7 7.4l5.2-3.8",
} as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-white/85">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Wordmark tone="dark" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed">
              {firm.descriptor}
            </p>
            <div className="mt-5 flex flex-col text-sm">
              <a
                href={firm.phoneHref}
                className="flex items-center gap-2.5 py-1 transition hover:text-gold-bright"
              >
                <FooterIcon path={icons.phone} />
                {firm.phone}
              </a>
              <a
                href={firm.emailHref}
                className="flex items-center gap-2.5 py-1 transition hover:text-gold-bright"
              >
                <FooterIcon path={icons.mail} />
                {firm.email}
              </a>
            </div>

            <div className="mt-6">
              <SocialLinks variant="footer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {footerNav.map((column) => (
              <div key={column.heading}>
                <h2 className="eyebrow text-gold-bright/80">{column.heading}</h2>
                <ul className="mt-3 space-y-0.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-block py-1.5 text-sm transition hover:text-white"
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

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {firm.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-3 font-serif italic text-white/50">
            <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
            {firm.signOff}
          </p>
          <div className="flex flex-wrap gap-x-5">
            <Link href="/disclaimer" className="inline-block py-1.5 transition hover:text-white">
              Disclaimer
            </Link>
            <Link href="/privacy" className="inline-block py-1.5 transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="inline-block py-1.5 transition hover:text-white">
              Cookie Policy
            </Link>
            <Link href="/terms" className="inline-block py-1.5 transition hover:text-white">
              Terms of Use
            </Link>
            <Link href="/sitemap.xml" className="inline-block py-1.5 transition hover:text-white">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
