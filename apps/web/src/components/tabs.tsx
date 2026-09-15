"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type TabDefinition = {
  id: string;
  label: string;
  panel: ReactNode;
};

/**
 * Tabbed detail view used by the practice-area and domain pages.
 *
 * Every panel is rendered server-side and kept in the DOM — inactive panels
 * are hidden with CSS, not unmounted. That matters here: these pages exist to
 * be indexed and cited, and content behind an unmounted tab is content a
 * crawler never sees.
 *
 * The active tab is mirrored into the URL hash so a link to a specific
 * section (e.g. `/services/banking-finance#faqs`) opens on that tab.
 */
export function Tabs({ tabs }: { tabs: TabDefinition[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const tablistRef = useRef<HTMLDivElement>(null);

  // Honour an incoming hash on mount and on back/forward navigation.
  useEffect(() => {
    function syncFromHash() {
      const hash = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!hash) return;

      if (tabs.some((tab) => tab.id === hash)) {
        setActive(hash);
        return;
      }

      /*
       * A hash naming something *inside* a panel — one service on a practice
       * page, linked from the practices index. Inactive panels are
       * `display: none`, so the browser cannot scroll to it on its own: open
       * the panel that holds it, then scroll once that panel has painted. Two
       * frames, because the first runs before React has committed the change.
       */
      const target = document.getElementById(hash);
      const tabId = target
        ?.closest<HTMLElement>('[role="tabpanel"]')
        ?.id.replace(/^panel-/, "");

      if (target && tabId && tabs.some((tab) => tab.id === tabId)) {
        setActive(tabId);
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            target.scrollIntoView({ behavior: "smooth", block: "start" }),
          ),
        );
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [tabs]);

  function selectTab(id: string) {
    setActive(id);
    document
      .getElementById(`tab-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    // replaceState rather than a hash assignment: we do not want the browser
    // to scroll the panel into view on every tab click.
    window.history.replaceState(null, "", `#${id}`);
  }

  /** Left/right arrow keys move between tabs, per WAI-ARIA tabs pattern. */
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.findIndex((tab) => tab.id === active);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    const next = tabs[nextIndex];
    selectTab(next.id);
    tablistRef.current
      ?.querySelector<HTMLButtonElement>(`#tab-${next.id}`)
      ?.focus();
  }

  return (
    <div>
      {/* Sticky tab strip. Sits below the sticky header. */}
      {/* Pinned flush under the header at whatever height it currently is —
          full height when the nav row is showing, ribbon-only once it has
          slid away — via the CSS variable the header keeps live. The
          fallback matches the header's height before that variable is set. */}
      <div
        className="sticky z-30 -mx-6 border-b border-line bg-paper/95 px-6 backdrop-blur"
        style={{ top: "var(--header-h, 4.5rem)" }}
      >
        {/* More tabs off to the right — a phone-width hint that the strip scrolls. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-paper to-transparent sm:hidden"
        />
        <div
          ref={tablistRef}
          role="tablist"
          aria-label="Section"
          onKeyDown={onKeyDown}
          className="mx-auto flex max-w-5xl snap-x gap-1 overflow-x-auto pr-8 [scrollbar-width:none] sm:pr-0 [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === active;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                className={`shrink-0 snap-start border-b-2 px-4 py-4 text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? "border-gold text-gold-deep"
                    : "border-transparent text-slate hover:border-line-strong hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        {tabs.map((tab) => {
          const isActive = tab.id === active;

          return (
            <div
              key={tab.id}
              id={`panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              className={isActive ? "fade-in py-12 sm:py-14" : "hidden"}
            >
              {tab.panel}
            </div>
          );
        })}
      </div>
    </div>
  );
}
