import "server-only";

/** The request's "now" (ms), read once in a Server Component and passed down,
 *  so server and client render the same relative times. */
export function requestNow(): number {
  return Date.now();
}
