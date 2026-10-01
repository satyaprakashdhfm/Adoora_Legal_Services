/**
 * Headline-style capitals for headings and labels across the public site:
 * every word starts with a capital except the short joining words below,
 * which stay lower case unless they open or close the heading or follow a
 * colon.
 * Words that already carry capitals (RBI's, ADOORA, NBFCs, M&A) are left as
 * they are, and each part of a hyphenated word is treated on its own
 * ("client-first" becomes "Client-First").
 */
const MINOR = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into",
  "nor", "of", "on", "or", "per", "the", "to", "via", "vs", "with",
]);

function capitalise(part: string): string {
  const index = part.search(/[a-z]/i);
  if (index < 0) return part;
  // Leave words that already have a capital somewhere (acronyms, names).
  if (/[A-Z]/.test(part)) return part;
  return part.slice(0, index) + part[index].toUpperCase() + part.slice(index + 1);
}

export function titleCase(text: string): string {
  const words = text.split(/(\s+)/);
  let last = words.length - 1;
  while (last > 0 && /^\s*$/.test(words[last])) last--;
  let startOfClause = true;
  return words
    .map((word, index) => {
      if (/^\s+$/.test(word) || word === "") return word;
      const bare = word.toLowerCase().replace(/[^a-z]/g, "");
      const result =
        !startOfClause && index !== last && MINOR.has(bare) && !/[A-Z]/.test(word)
          ? word
          : word.split("-").map(capitalise).join("-");
      startOfClause = /[:?!.]$/.test(word);
      return result;
    })
    .join("");
}
