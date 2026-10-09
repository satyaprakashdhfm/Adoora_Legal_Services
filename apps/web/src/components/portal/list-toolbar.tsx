"use client";

import { inputClass } from "@/components/portal/ui";

/**
 * The search, filter and sort bar that sits at the top of an admin list,
 * inside its card. One layout everywhere: the search box takes the spare
 * width, filters and sort follow on the same line from md up and wrap on
 * phones, and a count with "Clear filters" sits underneath.
 */

export type ToolbarOption = { value: string; label: string };

export type ToolbarFilter = {
  key: string;
  label: string;
  value: string;
  options: readonly ToolbarOption[];
  onChange: (value: string) => void;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate">
      <path d="M9 15a6 6 0 100-12 6 6 0 000 12zM17 17l-3.6-3.6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

const selectClass = `${inputClass} w-full md:w-auto md:min-w-36`;

export function ListToolbar({
  search,
  filters = [],
  sort,
  count,
  onReset,
}: {
  search?: { value: string; onChange: (value: string) => void; placeholder: string };
  filters?: ToolbarFilter[];
  sort?: { value: string; options: readonly ToolbarOption[]; onChange: (value: string) => void };
  /** e.g. "12 clients"; omitted while loading. */
  count?: string;
  /** Shown as "Clear filters" whenever a search or filter is set. */
  onReset?: () => void;
}) {
  const active = Boolean(search?.value.trim()) || filters.some((filter) => filter.value !== "");

  return (
    <div className="border-b border-line p-4">
      <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center">
        {search && (
          <div className="relative min-w-0 md:min-w-64 md:flex-1">
            <SearchIcon />
            <input
              type="search"
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              aria-label={search.placeholder}
              className={`${inputClass} pl-9`}
            />
          </div>
        )}
        {(filters.length > 0 || sort) && (
          <div className="grid grid-cols-2 gap-2.5 md:flex md:flex-wrap md:items-center">
            {filters.map((filter) => (
              <select
                key={filter.key}
                aria-label={filter.label}
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
                className={`${selectClass} ${filter.value ? "border-gold bg-gold/5 font-semibold" : ""}`}
              >
                <option value="">{filter.label}: all</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
            {sort && (
              <label className="col-span-2 flex items-center gap-2 md:col-span-1 md:ml-auto">
                <span className="portal-label shrink-0 text-xs font-semibold uppercase tracking-wide text-slate">Sort</span>
                <select
                  aria-label="Sort by"
                  value={sort.value}
                  onChange={(event) => sort.onChange(event.target.value)}
                  className={selectClass}
                >
                  {sort.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </div>
      {(count || (active && onReset)) && (
        <div className="mt-2.5 flex items-center gap-3 text-xs text-slate">
          {count && <span>{count}</span>}
          {active && onReset && (
            <button type="button" onClick={onReset} className="font-semibold text-gold-deep hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
