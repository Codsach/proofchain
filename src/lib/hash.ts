import crypto from "crypto";

/**
 * Computes SHA-256 hash of a buffer.
 * Always computed server-side — never accept a hash from the client.
 *
 * @param buffer - Raw file bytes
 * @returns Hex string of the SHA-256 digest
 */
export function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}