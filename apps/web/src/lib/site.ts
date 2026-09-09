/**
 * Canonical site origin, used for metadataBase, the sitemap and JSON-LD.
 *
 * Set NEXT_PUBLIC_SITE_URL in the environment (Railway sets a domain per
 * service). The fallback is the production domain so a build without the
 * variable still emits correct absolute URLs.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.adooralegalservices.com";

/** Base URL for the Express API. Empty string means "same origin /api". */
export const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
