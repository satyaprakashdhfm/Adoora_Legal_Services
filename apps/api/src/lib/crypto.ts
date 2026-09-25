import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { env, isProduction } from "../env.js";

/**
 * Envelope encryption for stored documents.
 *
 * Each document version is encrypted with its own random 256-bit data key
 * (AES-256-GCM). The data key is then encrypted ("wrapped") with the master
 * key from DOCUMENT_ENCRYPTION_KEY and stored in Postgres next to the version.
 * The bucket therefore only ever holds ciphertext, and reading a document
 * needs both the bucket object and the database row.
 *
 * GCM authenticates as well as encrypts: a tampered object fails to decrypt
 * rather than returning altered bytes.
 *
 * Rotation: records carry `encKeyId`. To rotate, add the new key under a new
 * id, keep the old one readable, and re-wrap the data keys — the documents
 * themselves never need re-encrypting.
 */

const ALGORITHM = "aes-256-gcm";

function loadMasterKey(): Buffer {
  if (env.DOCUMENT_ENCRYPTION_KEY) {
    const key = Buffer.from(env.DOCUMENT_ENCRYPTION_KEY, "base64");
    if (key.length !== 32) {
      throw new Error("DOCUMENT_ENCRYPTION_KEY must decode to exactly 32 bytes.");
    }
    return key;
  }

  // env.ts refuses to start without a key in production; this is dev only.
  if (isProduction) throw new Error("DOCUMENT_ENCRYPTION_KEY is not set.");
  return createHash("sha256").update("adoora-development-document-key").digest();
}

const masterKey = loadMasterKey();
const masterKeyId = env.DOCUMENT_ENCRYPTION_KEY_ID;

export type EncryptedPayload = {
  ciphertext: Buffer;
  encKeyId: string;
  wrappedKey: string;
  iv: string;
  authTag: string;
};

function seal(key: Buffer, plaintext: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { iv, ciphertext, authTag: cipher.getAuthTag() };
}

function open(key: Buffer, iv: Buffer, ciphertext: Buffer, authTag: Buffer) {
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function encryptDocument(plaintext: Buffer): EncryptedPayload {
  const dataKey = randomBytes(32);
  const body = seal(dataKey, plaintext);
  const wrapped = seal(masterKey, dataKey);

  return {
    ciphertext: body.ciphertext,
    encKeyId: masterKeyId,
    // iv | tag | wrapped key, in one field.
    wrappedKey: Buffer.concat([wrapped.iv, wrapped.authTag, wrapped.ciphertext]).toString("base64"),
    iv: body.iv.toString("base64"),
    authTag: body.authTag.toString("base64"),
  };
}

export function decryptDocument(
  ciphertext: Buffer,
  meta: { encKeyId: string; wrappedKey: string; iv: string; authTag: string },
): Buffer {
  if (meta.encKeyId !== masterKeyId) {
    throw new Error(`Document was encrypted with key "${meta.encKeyId}", which is not loaded.`);
  }

  const wrapped = Buffer.from(meta.wrappedKey, "base64");
  const dataKey = open(
    masterKey,
    wrapped.subarray(0, 12),
    wrapped.subarray(28),
    wrapped.subarray(12, 28),
  );

  return open(
    dataKey,
    Buffer.from(meta.iv, "base64"),
    ciphertext,
    Buffer.from(meta.authTag, "base64"),
  );
}

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}
