/**
 * The storage contract every provider implements.
 *
 * Deliberately small: document routes only ever put, fetch and delete whole
 * objects by key. Anything provider-specific (endpoints, credentials, path
 * style, directories) stays inside the driver, so moving from Railway Buckets
 * to another provider is a change of driver or of environment variables —
 * never of the routes.
 *
 * Objects arrive here already encrypted (see lib/crypto.ts), so a driver
 * never sees plaintext and needs no security features of its own.
 */
export interface StorageDriver {
  /** Stored on each document version, so old objects stay readable after a switch. */
  readonly name: string;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** Cheap reachability check for the readiness probe. */
  check(): Promise<boolean>;
}

export class ObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`Stored object not found: ${key}`);
    this.name = "ObjectNotFoundError";
  }
}
