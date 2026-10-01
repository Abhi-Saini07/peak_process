import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM encryption for the small set of columns that need it:
 * Aadhaar, PAN, and UAN numbers (personal_information.*_enc). Everything
 * else (name, email, phone, address, emergency contact) relies on
 * transport security (TLS to MySQL), the provider's at-rest disk
 * encryption, and API-layer access control instead — see the write-up's
 * Security section for why that split is the right one here, not
 * column-level encryption for every field.
 *
 * Server-only. Never import this from a Client Component.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended nonce length for GCM
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with: " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must decode to exactly 32 bytes (got ${key.length}).`);
  }
  return key;
}

/** Encrypts a plaintext string. Returns null for null/undefined/empty input.
 *  Typed as Uint8Array<ArrayBuffer> (not Buffer) to match what Prisma's
 *  generated client expects for Bytes columns — Buffer.concat's output is
 *  always backed by a plain ArrayBuffer, so this cast is sound. */
export function encryptField(plaintext: string | null | undefined): Uint8Array<ArrayBuffer> | null {
  if (!plaintext) return null;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Stored layout: [12-byte IV][ciphertext][16-byte auth tag]
  return Buffer.concat([iv, ciphertext, authTag]) as Uint8Array<ArrayBuffer>;
}

/** Decrypts a value produced by encryptField. Returns null for null input. */
export function decryptField(stored: Buffer | Uint8Array | null | undefined): string | null {
  if (!stored) return null;
  const buf = Buffer.isBuffer(stored) ? stored : Buffer.from(stored);
  if (buf.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Encrypted field is too short to be valid — possible data corruption.");
  }
  const key = getKey();
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(buf.length - AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
