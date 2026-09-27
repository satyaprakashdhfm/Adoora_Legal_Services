import type { ArticleBlock } from "@/lib/portal/api";

/**
 * The editor's SEO checklist — the on-page checks search engines and the
 * usual SEO plugins look at, run live against what the writer has typed.
 * Advisory only: nothing here blocks publishing.
 */

export type SeoInput = {
  title: string;
  metaTitle: string;
  summary: string;
  slug: string;
  focusKeyword: string;
  keywords: string[];
  body: ArticleBlock[];
  hasCover: boolean;
  hasAuthor: boolean;
};

export type SeoCheck = { label: string; state: "good" | "warn" | "bad"; detail?: string };

export const TITLE_RANGE = [30, 60] as const;
export const DESCRIPTION_RANGE = [120, 160] as const;

export function bodyText(blocks: ArticleBlock[]): string {
  return blocks
    .map((block) => ("text" in block ? block.text : "items" in block ? block.items.join(" ") : block.caption ?? ""))
    .join(" ");
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const norm = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
const contains = (haystack: string, needle: string) => Boolean(needle) && norm(haystack).includes(norm(needle));

function occurrences(text: string, phrase: string): number {
  const needle = norm(phrase);
  if (!needle) return 0;
  const hay = norm(text);
  let count = 0;
  for (let at = hay.indexOf(needle); at !== -1; at = hay.indexOf(needle, at + needle.length)) count++;
  return count;
}

const inRange = (n: number, [min, max]: readonly [number, number]) => n >= min && n <= max;

export function analyse(input: SeoInput): { checks: SeoCheck[]; score: number; words: number } {
  const seoTitle = input.metaTitle.trim() || input.title.trim();
  const text = bodyText(input.body);
  const words = wordCount(text);
  const keyword = input.focusKeyword.trim();
  const firstParagraph = (input.body.find((block) => block.type === "p") as { text: string } | undefined)?.text ?? "";
  const headings = input.body.filter((block) => block.type === "h2" || block.type === "h3") as { text: string }[];
  const images = input.body.filter((block): block is Extract<ArticleBlock, { type: "image" }> => block.type === "image");
  const checks: SeoCheck[] = [];

  checks.push({
    label: "Title length",
    state: inRange(seoTitle.length, TITLE_RANGE) ? "good" : seoTitle.length < 15 || seoTitle.length > 75 ? "bad" : "warn",
    detail: `${seoTitle.length} characters — aim for ${TITLE_RANGE[0]}–${TITLE_RANGE[1]} so Google shows it whole.`,
  });

  const description = input.summary.trim().length;
  checks.push({
    label: "Summary (meta description) length",
    state: inRange(description, DESCRIPTION_RANGE) ? "good" : description < 60 ? "bad" : "warn",
    detail: `${description} characters — aim for ${DESCRIPTION_RANGE[0]}–${DESCRIPTION_RANGE[1]}.`,
  });

  if (!keyword) {
    checks.push({ label: "Focus keyword", state: "bad", detail: "Set the main search this article should rank for." });
  } else {
    checks.push({ label: "Focus keyword in the title", state: contains(seoTitle, keyword) ? "good" : "bad" });
    checks.push({ label: "Focus keyword in the summary", state: contains(input.summary, keyword) ? "good" : "warn" });
    checks.push({
      label: "Focus keyword in the first paragraph",
      state: contains(firstParagraph, keyword) ? "good" : "warn",
    });
    checks.push({
      label: "Focus keyword in a subheading",
      state: headings.some((heading) => contains(heading.text, keyword)) ? "good" : "warn",
    });
    const slugWords = norm(keyword).split(" ").filter((word) => word.length > 2);
    checks.push({
      label: "Focus keyword in the web address",
      state: slugWords.length && slugWords.every((word) => input.slug.includes(word)) ? "good" : "warn",
      detail: input.slug ? `/insights/${input.slug}` : undefined,
    });
    const density = words ? (occurrences(text, keyword) * wordCount(keyword) * 100) / words : 0;
    checks.push({
      label: "Keyword density",
      state: density >= 0.5 && density <= 2.5 ? "good" : density > 3.5 || density === 0 ? "bad" : "warn",
      detail: `${density.toFixed(1)}% — natural use is about 0.5–2.5%. Higher reads as stuffing.`,
    });
  }

  checks.push({
    label: "Length",
    state: words >= 600 ? "good" : words >= 300 ? "warn" : "bad",
    detail: `${words} words — 600+ tends to rank; judgment write-ups often run 800–1,500.`,
  });

  checks.push({
    label: "Subheadings",
    state: headings.length >= 2 ? "good" : words < 300 ? "warn" : "bad",
    detail: `${headings.length} — break the piece into sections a reader can scan.`,
  });

  if (images.length) {
    const missing = images.filter((image) => !image.alt.trim()).length;
    checks.push({
      label: "Image descriptions (alt text)",
      state: missing ? "bad" : "good",
      detail: missing ? `${missing} image${missing === 1 ? "" : "s"} without a description.` : undefined,
    });
  }

  checks.push({ label: "Cover image", state: input.hasCover ? "good" : "warn", detail: input.hasCover ? undefined : "Shown on the card and when the article is shared." });
  checks.push({ label: "Author", state: input.hasAuthor ? "good" : "warn", detail: input.hasAuthor ? undefined : "A named lawyer helps readers and search engines trust it." });

  const others = input.keywords.filter((k) => norm(k) !== norm(keyword));
  if (others.length) {
    const unused = others.filter((k) => !contains(`${seoTitle} ${input.summary} ${text}`, k));
    checks.push({
      label: "Other target keywords used",
      state: unused.length === 0 ? "good" : unused.length < others.length ? "warn" : "bad",
      detail: unused.length ? `Not yet in the text: ${unused.join(", ")}` : undefined,
    });
  }

  const points = checks.reduce((sum, check) => sum + (check.state === "good" ? 1 : check.state === "warn" ? 0.5 : 0), 0);
  return { checks, score: Math.round((points / checks.length) * 100), words };
}
