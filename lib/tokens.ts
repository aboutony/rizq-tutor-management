
import { randomBytes, createHash } from 'crypto';

/**
 * Generates a cryptographically secure random token and its SHA-256 hash.
 * @returns An object containing the raw token and its hash.
 */
export function generateTokenAndHash(): { token: string, hash: string } {
  const token = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Hashes a raw token using SHA-256.
 * @param token The raw token to hash.
 * @returns The SHA-256 hash of the token.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
