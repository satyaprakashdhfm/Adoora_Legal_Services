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

/**
 * Pixel size of an image in `public/`, from its header — PNG and JPEG only
 * (null for anything else, or a file that can't be read). For layouts that
 * need a frame's true aspect ratio, such as the inner-page header, where the
 * photograph is supplied by hand and may change shape.
 */
export function publicImageSize(url: string): { width: number; height: number } | null {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", url.replace(/^\//, "")));
    // PNG: width and height are big-endian at bytes 16 and 20 of IHDR.
    if (buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    // JPEG: walk the segments to the first start-of-frame marker.
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) return null;
        const marker = buf[i + 1];
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch {}
  return null;
}
