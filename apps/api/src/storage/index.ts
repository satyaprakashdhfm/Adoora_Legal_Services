import { env } from "../env.js";
import { LocalStorage } from "./local.js";
import { S3Storage } from "./s3.js";
import type { StorageDriver } from "./types.js";

export { ObjectNotFoundError, type StorageDriver } from "./types.js";

/**
 * Driver registry. Adding a provider with a non-S3 API (Azure Blob, Google
 * Cloud Storage) means writing one class that implements StorageDriver and
 * adding a case here; nothing else in the API changes.
 */
function createDriver(name: string): StorageDriver {
  switch (name) {
    case "s3":
      return new S3Storage({
        // env.ts refuses to start with STORAGE_DRIVER=s3 and these missing.
        bucket: env.S3_BUCKET!,
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        accessKeyId: env.S3_ACCESS_KEY_ID!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
      });
    case "local":
      return new LocalStorage(env.LOCAL_STORAGE_DIR);
    default:
      throw new Error(`Unknown storage driver: ${name}`);
  }
}

/** Where new uploads go. */
export const storage: StorageDriver = createDriver(env.STORAGE_DRIVER);

/**
 * The driver that holds an existing object. Versions record the driver they
 * were written with, so after a move the old objects are still read from
 * where they are until they are migrated.
 */
export function storageFor(driverName: string): StorageDriver {
  return driverName === storage.name ? storage : createDriver(driverName);
}
