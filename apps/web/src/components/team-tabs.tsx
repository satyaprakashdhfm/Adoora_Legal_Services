"use client";

import Link from "next/link";
import { useState } from "react";
import type { Person } from "@/content/people";

export type TeamGroup = {
  id: string;
  label: string;
  members: Person[];
};

/**
 * The home-page team band.
 *
 * Both rosters are rendered and the inactive one is hidden with CSS rather
 * than unmounted — the names are the point of the section, and a crawler
 * never sees content behind an unmounted tab. Each row links through to that
 * person's entry on the About page.
 */
export function TeamTabs({ groups }: { groups: TeamGroup[] }) {
  const [active, setActive] = useState(groups[0]?.id ?? "");

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = groups.findIndex((group) => group.id === active);
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (current + 1) % groups.length;
    if (event.key === "ArrowLeft") next = (current - 1 + groups.length) % groups.length;
    if (next === null) return;

    event.preventDefault();
    setActive(groups[next].id);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`#team-tab-${groups[next].id}`)
      ?.focus();
  }

  return (
    <div>
      {/* A single group has nothing to switch between — the tablist would be
          one permanently-active button. */}
      {groups.length > 1 && (
        <div
          role="tablist"
          aria-label="Team"
          onKeyDown={onKeyDown}
          className="grid grid-cols-2 border-b border-line sm:flex sm:gap-8"
        >
          {groups.map((group) => {
            const isActive = group.id === active;

            return (
              <button
                key={group.id}
                id={`team-tab-${group.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`team-panel-${group.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(group.id)}
                className={`-mb-px border-b-2 px-1 pb-3 text-left text-sm font-semibold leading-snug transition sm:shrink-0 sm:whitespace-nowrap ${
                  isActive
                    ? "border-gold text-ink"
                    : "border-transparent text-slate hover:text-ink"
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      )}

      {groups.map((group) => {
        const isActive = group.id === active;

        return (
          <div
            key={group.id}
            id={`team-panel-${group.id}`}
            role="tabpanel"
            aria-labelledby={`team-tab-${group.id}`}
            className={isActive ? "fade-in" : "hidden"}
          >
            <ul className="grid gap-x-12 sm:grid-cols-2">
              {group.members.map((person) => (
                <li key={person.slug}>
                  <Link
                    href={`/about#${person.slug}`}
                    className="group flex items-center gap-3 border-b border-line py-3 transition hover:border-gold/50 sm:gap-4"
                  >
                    {/* Designation sits under the name on a phone, beside it
                        from sm up. */}
                    <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-4">
                      <span className="min-w-0 flex-1 font-serif text-sm font-semibold text-ink transition group-hover:text-gold-deep">
                        {person.name}
                      </span>
                      <span className="text-xs text-gold-deep sm:shrink-0">
                        {person.designation}
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 text-slate-light transition group-hover:translate-x-0.5 group-hover:text-gold-deep"
                    >
                      <path
                        d="M2 8h11M9 4l4 4-4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
