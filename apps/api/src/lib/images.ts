/**
 * Uploaded website images (portraits, partner logos): their type, read from
 * the magic bytes rather than the file name, and their pixel size, read from
 * the file header so no image library is needed.
 */

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

/** JPEG, PNG or WebP, by their magic bytes; anything else is null. */
export function imageType(buffer: Buffer): ImageType | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/** Width and height in pixels, or null when the header cannot be read. */
export function imageSize(buffer: Buffer, type: ImageType): { width: number; height: number } | null {
  try {
    if (type === "image/png") {
      // IHDR is always the first chunk: width and height follow its tag.
      if (buffer.subarray(12, 16).toString("ascii") !== "IHDR") return null;
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (type === "image/webp") return webpSize(buffer);
    return jpegSize(buffer);
  } catch {
    // A header cut short reads past the end; the file is unusable either way.
    return null;
  }
}

function webpSize(buffer: Buffer): { width: number; height: number } | null {
  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8 ") {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  }
  return null;
}

/** Walks the JPEG segments to the first start-of-frame marker. */
function jpegSize(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1]!;
    // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC), carry the size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  return null;
}
