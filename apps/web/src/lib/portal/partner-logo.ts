/**
 * The rules for a logo in the home page's "Our Partners" honeycomb, shared by
 * Website → Our Partners and the organisation tick box in Clients. The API
 * enforces the same rules (routes/website.ts); checking here first gives the
 * admin the answer before the upload rather than after.
 */

export const LOGO_TYPES = ["image/png", "image/webp", "image/jpeg"];
const LOGO_MAX_BYTES = 1024 * 1024;
const LOGO_MIN_PX = 200;
const LOGO_MAX_PX = 2000;

export const LOGO_GUIDE =
  "Square PNG, 400 × 400 px, transparent background, up to 1 MB. WebP or JPEG also work; any square size from 200 to 2000 px is accepted.";

/** Null when the file is fine, otherwise what to fix. */
export async function checkLogo(file: File): Promise<string | null> {
  if (!LOGO_TYPES.includes(file.type)) return "Please choose a PNG, WebP or JPEG image.";
  if (file.size > LOGO_MAX_BYTES) return `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Logos can be up to 1 MB.`;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return "This image could not be read. Please export it again and retry.";
  const { width, height } = bitmap;
  bitmap.close();
  if (width !== height) return `Logos must be square. This one is ${width} × ${height} px; please crop it to 400 × 400 px.`;
  if (width < LOGO_MIN_PX || width > LOGO_MAX_PX) return `This logo is ${width} × ${height} px. Please export it at 400 × 400 px.`;
  return null;
}
