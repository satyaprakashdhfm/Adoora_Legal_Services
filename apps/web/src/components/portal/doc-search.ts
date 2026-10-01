import { headingId } from "@/components/portal/doc-markdown";

export type DocHit = {
  /** The text around the match, as plain words. */
  text: string;
  /** The ## or ### section it sits under, to open the chapter there. */
  heading: { text: string; id: string } | null;
};

export type DocResult = {
  id: string;
  title: string;
  /** 1-based, as the chapter list numbers it. */
  number: number;
  titleMatches: boolean;
  hits: DocHit[];
};

/** One line of Markdown as the words a reader sees. */
function plainLine(line: string) {
  let text = line.trim();
  if (/^\|?\s*:?-{3,}/.test(text)) return "";
  if (text.startsWith("|")) {
    text = text
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean)
      .map((cell) => (/[.:;!?]$/.test(cell) ? cell : `${cell}.`))
      .join(" ");
  }
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .replace(/^(#{1,6}|>|[-*]|\d+\.)\s+/, "")
    .trim();
}

export function searchTerms(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

/** A long line cut down to the part around the first match. */
function excerpt(text: string, terms: string[], room = 150) {
  if (text.length <= room) return text;
  const lower = text.toLowerCase();
  const at = Math.min(...terms.map((term) => lower.indexOf(term)).filter((i) => i >= 0));
  let start = Math.max(0, at - 50);
  if (start > 0) start = text.indexOf(" ", start) + 1 || start;
  let end = Math.min(text.length, start + room);
  if (end < text.length) end = text.lastIndexOf(" ", end) > start ? text.lastIndexOf(" ", end) : end;
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

/**
 * The chapters that mention every word of the query, with the lines that do.
 * Chapters whose title matches come first, then those with the most lines.
 */
export function searchDocs(pages: { id: string; title: string; body: string }[], query: string): DocResult[] {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const has = (text: string) => {
    const lower = text.toLowerCase();
    return terms.every((term) => lower.includes(term));
  };

  const results: DocResult[] = [];
  pages.forEach((page, index) => {
    const hits: DocHit[] = [];
    let heading: DocHit["heading"] = null;
    let fenced = false;
    for (const line of page.body.split("\n")) {
      if (line.trimStart().startsWith("```")) fenced = !fenced;
      const headingMatch = fenced ? null : /^(##|###)\s+(.+?)\s*#*$/.exec(line);
      if (headingMatch) {
        const text = headingMatch[2].replace(/\*\*|__|`/g, "");
        heading = { text, id: headingId(text) };
      }
      const text = plainLine(line);
      if (text && has(text)) hits.push({ text: excerpt(text, terms), heading });
    }
    const titleMatches = has(page.title);
    if (titleMatches || hits.length)
      results.push({
        id: page.id,
        title: page.title,
        number: index + 1,
        titleMatches,
        hits,
      });
  });
  return results.sort((a, b) => Number(b.titleMatches) - Number(a.titleMatches) || b.hits.length - a.hits.length);
}

/** Text split into the parts that match the query and the parts that do not. */
export function markTerms(text: string, terms: string[]) {
  if (!terms.length) return [{ text, match: false }];
  const pattern = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => ({ text: part, match: terms.includes(part.toLowerCase()) }));
}
