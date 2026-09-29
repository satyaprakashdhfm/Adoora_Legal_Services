import Link from "next/link";
import { firm } from "@/content/firm";

/**
 * What a client sees before the firm has linked a case to their account.
 * Clients do not add cases themselves: the firm opens the matter, runs its
 * conflicts check and links it here, after which the case, its hearings,
 * orders and documents appear.
 */
export function NoCaseYet() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="font-serif text-lg font-semibold text-ink">No case is linked to your account yet</p>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        Please contact us to set up a meeting with the team. Once the firm takes on your matter, it links the case to this account and its hearing
        dates, court orders and documents appear here.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/contact" className="inline-flex items-center rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright">
          Set up a meeting
        </Link>
        <a href={firm.phoneHref} className="inline-flex items-center rounded-md border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-gold">
          Call {firm.phone}
        </a>
      </div>
      <p className="mt-3 text-xs text-slate">
        Or write to <a href={`mailto:${firm.email}`} className="font-semibold text-gold-deep hover:underline">{firm.email}</a>
      </p>
    </div>
  );
}
