"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT,
  COOKIE_DISCLAIMER,
  cookieCategories,
} from "@/content/legal";
import { readCookie, writeCookie, type ConsentState } from "@/lib/cookies";

/**
 * Cookie consent banner with per-category control.
 *
 * Appears only after the disclaimer has been accepted, so the two never stack.
 * Nothing beyond the strictly necessary cookies is set until a choice is made;
 * there is no implied consent from continued browsing.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Poll briefly so the banner appears right after the gate is accepted
    // without the user needing to navigate.
    function check() {
      const disclaimerAccepted = readCookie(COOKIE_DISCLAIMER) === "true";
      const consentGiven = readCookie(COOKIE_CONSENT) !== null;
      setVisible(disclaimerAccepted && !consentGiven);
    }

    check();
    const interval = window.setInterval(check, 800);
    return () => window.clearInterval(interval);
  }, []);

  function save(state: { analytics: boolean; marketing: boolean }) {
    const consent: ConsentState = {
      essential: true,
      analytics: state.analytics,
      marketing: state.marketing,
      at: new Date().toISOString(),
    };

    writeCookie(COOKIE_CONSENT, JSON.stringify(consent), 180);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie preferences"
      className="fade-in fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper shadow-[0_-8px_30px_rgba(15,20,28,0.08)]"
    >
      <div className="container-page py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-ink">
              Cookies on this website
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              We use strictly necessary cookies to make this website work.
              We&rsquo;d also like to set optional cookies to understand how the
              site is used. Nothing optional is set unless you allow it. See our{" "}
              <Link href="/cookies" className="text-gold-deep underline underline-offset-2">
                Cookie Policy
              </Link>
              .
            </p>

            <button
              type="button"
              onClick={() => setShowDetail((open) => !open)}
              aria-expanded={showDetail}
              className="mt-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep transition hover:text-gold-deep"
            >
              {showDetail ? "Hide preferences" : "Manage preferences"}
            </button>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => save({ analytics: false, marketing: false })}
              className="rounded-full border border-line-strong px-6 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-slate hover:text-ink"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => save({ analytics: true, marketing: true })}
              className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-mid"
            >
              Accept all
            </button>
          </div>
        </div>

        {showDetail && (
          <div className="fade-in mt-5 border-t border-line pt-5">
            <ul className="grid gap-4 sm:grid-cols-3">
              {cookieCategories.map((category) => {
                const checked =
                  category.id === "essential"
                    ? true
                    : category.id === "analytics"
                      ? analytics
                      : marketing;

                return (
                  <li
                    key={category.id}
                    className="rounded-lg border border-line bg-paper-warm p-4"
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={category.required}
                        onChange={(event) => {
                          if (category.id === "analytics") {
                            setAnalytics(event.target.checked);
                          } else if (category.id === "marketing") {
                            setMarketing(event.target.checked);
                          }
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-gold)] disabled:opacity-60"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-ink">
                          {category.name}
                          {category.required && (
                            <span className="ml-1.5 text-xs font-normal text-slate-light">
                              (always on)
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                          {category.description}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => save({ analytics, marketing })}
              className="mt-4 rounded-md bg-gold px-6 py-2.5 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright"
            >
              Save preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
