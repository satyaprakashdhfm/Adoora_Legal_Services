"use client";

import { useMemo, useState } from "react";
import { Input, Select } from "@/components/portal/ui";

/**
 * Choosing people for a case: several at once, by ticking them. A case can
 * have any number of lawyers and any number of client accounts.
 */

export type PickPerson = { id: string; name: string; detail?: string };

export function PeoplePicker({
  people,
  value,
  onChange,
  label,
  empty = "Nobody to choose yet.",
}: {
  people: PickPerson[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** For screen readers: what is being chosen. */
  label: string;
  empty?: string;
}) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? people.filter((p) => `${p.name} ${p.detail ?? ""}`.toLowerCase().includes(q)) : people;
  }, [people, query]);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  if (people.length === 0) return <p className="text-sm text-slate">{empty}</p>;

  return (
    <div className="rounded-lg border border-line-strong bg-white">
      {people.length > 6 && (
        <div className="border-b border-line p-2">
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone or email" aria-label={`Search ${label}`} />
        </div>
      )}
      <ul role="group" aria-label={label} className="max-h-60 divide-y divide-line overflow-y-auto">
        {shown.map((person) => {
          const checked = value.includes(person.id);
          return (
            <li key={person.id}>
              <label className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition ${checked ? "bg-gold/10" : "hover:bg-paper-warm"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(person.id)} className="h-4 w-4 shrink-0 accent-[var(--color-gold)]" />
                <span className="min-w-0">
                  <span className={`block truncate text-sm ${checked ? "font-semibold text-ink" : "text-ink"}`}>{person.name}</span>
                  {person.detail && <span className="block truncate text-xs text-slate">{person.detail}</span>}
                </span>
              </label>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-3 py-3 text-sm text-slate">No one matches “{query}”.</li>}
      </ul>
      <div className="flex items-center justify-between border-t border-line px-3 py-2 text-xs text-slate">
        <span>{value.length === 0 ? "None chosen" : `${value.length} chosen`}</span>
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="font-semibold text-gold-deep hover:underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export type TeamRole = "LEAD" | "ASSOCIATE" | "SUPPORT";
export type TeamEntry = { userId: string; role: TeamRole };

const ROLE_OPTIONS = [
  { value: "LEAD", label: "Lead counsel" },
  { value: "ASSOCIATE", label: "Associate" },
  { value: "SUPPORT", label: "Support" },
];

/**
 * The lawyers on a case: tick as many as it needs, then set each one's role.
 * The first chosen is the lead unless someone else already is.
 */
export function TeamPicker({ lawyers, value, onChange }: { lawyers: PickPerson[]; value: TeamEntry[]; onChange: (next: TeamEntry[]) => void }) {
  function pick(ids: string[]) {
    const kept = value.filter((entry) => ids.includes(entry.userId));
    const added = ids.filter((id) => !kept.some((entry) => entry.userId === id));
    const next = [...kept];
    for (const id of added) next.push({ userId: id, role: next.some((entry) => entry.role === "LEAD") ? "ASSOCIATE" : "LEAD" });
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <PeoplePicker people={lawyers} value={value.map((entry) => entry.userId)} onChange={pick} label="Lawyers on the case" empty="No lawyers on the Team page yet." />
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((entry) => {
            const person = lawyers.find((l) => l.id === entry.userId);
            return (
              <li key={entry.userId} className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-paper-warm px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{person?.name ?? "…"}</span>
                <Select
                  aria-label={`Role on the case: ${person?.name ?? "lawyer"}`}
                  value={entry.role}
                  onChange={(e) => onChange(value.map((v) => (v.userId === entry.userId ? { ...v, role: e.target.value as TeamRole } : v)))}
                  options={ROLE_OPTIONS}
                  className="w-36"
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** The line under a person's name: what tells two people apart. */
export function personDetail(person: { role?: string | null; phone?: string | null; email?: string | null }) {
  const role = person.role ? person.role.charAt(0) + person.role.slice(1).toLowerCase() : null;
  return [role, person.phone, person.email].filter(Boolean).join(" · ");
}
