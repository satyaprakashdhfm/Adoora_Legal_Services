/**
 * A stable in-page anchor for a heading, derived from its text.
 *
 * Used for the services listed on a practice page, so the practices index can
 * link to one case type rather than to the top of the page. "Rupee and foreign
 * currency debt" becomes `rupee-and-foreign-currency-debt`. Changing a
 * service's title changes its anchor, which breaks any external link to it —
 * acceptable for copy that changes rarely.
 */
export function anchorFor(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
