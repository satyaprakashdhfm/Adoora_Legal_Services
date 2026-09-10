import fs from "node:fs";
import path from "node:path";

/**
 * Resolve a file in `public/` by base name, whichever image extension it was
 * saved with, and return the URL path — or null when nothing is there.
 *
 * Server-only, and read at build time for the statically rendered pages. It
 * exists because the hero photography is dropped into `public/` by hand: the
 * first one arrived as .png against a .jpg reference and the hero silently
 * fell back to a bare gradient. Resolving the extension removes that whole
 * class of breakage, and a missing file degrades to null rather than a 404.
 */
const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

export function publicImage(base: string): string | null {
  const dir = path.join(process.cwd(), "public");

  for (const extension of EXTENSIONS) {
    if (fs.existsSync(path.join(dir, `${base}${extension}`))) {
      return `/${base}${extension}`;
    }
  }

  return null;
}
