"use client";

import { useEffect, useState } from "react";

/**
 * "On this page" for an article: its h2 sections, with the one being read
 * picked out in gold, moving down the list as the article scrolls. A section
 * counts as being read once its heading has passed the upper third of the
 * screen; clicking an entry scrolls to it (the ids come from ArticleBody).
 */
export function ArticleToc({ items }: { items: { id: string; text: string }[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current = items[0]!.id;
      for (const item of items) {
        const heading = document.getElementById(item.id);
        if (heading && heading.getBoundingClientRect().top <= line) current = item.id;
      }
      // At the very end of the page the last section is the one being read,
      // even if its heading never reaches the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = items[items.length - 1]!.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <h2 className="eyebrow text-gold-deep">On this page</h2>
      <ol className="mt-4 space-y-1 border-l border-line text-sm">
        {items.map((item, index) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`-ml-px flex gap-2.5 rounded-r-md border-l-2 py-1.5 pl-4 pr-2 leading-snug transition-colors duration-300 ${
                  isActive
                    ? "border-gold bg-gold/10 font-semibold text-gold-deep"
                    : "border-transparent text-ink-soft hover:border-gold/50 hover:text-gold-deep"
                }`}
              >
                <span className={`tabular-nums ${isActive ? "text-gold" : "text-slate-light"}`}>{String(index + 1).padStart(2, "0")}</span>
                <span>{item.text}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
