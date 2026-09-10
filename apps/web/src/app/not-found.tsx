import Link from "next/link";
import { BrandMark } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-line-strong bg-paper-warm text-gold-deep"
        >
          <BrandMark className="h-9 w-auto" />
        </span>

        <p className="mt-8 eyebrow text-gold-deep">404</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink">
          We could not find that page
        </h1>
        <p className="mt-4 leading-relaxed text-slate">
          The address may have changed, or the page may no longer exist. The
          links below cover most of the site.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            { label: "Home", href: "/" },
            { label: "Practice areas", href: "/services" },
            { label: "Domains", href: "/domains" },
            { label: "Insights", href: "/insights" },
            { label: "Contact", href: "/contact" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition hover:border-gold hover:text-gold-deep"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
