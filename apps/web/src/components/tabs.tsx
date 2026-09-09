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
      const hash = window.location.hash.replace("#", "");
      if (hash && tabs.some((tab) => tab.id === hash)) {
        setActive(hash);
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [tabs]);

  function selectTab(id: string) {
    setActive(id);
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
      <div className="sticky top-[4.5rem] z-30 -mx-6 border-b border-line bg-paper/95 px-6 backdrop-blur lg:top-[6.5rem]">
        <div
          ref={tablistRef}
          role="tablist"
          aria-label="Section"
          onKeyDown={onKeyDown}
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`shrink-0 border-b-2 px-4 py-4 text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? "border-gold text-gold"
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
