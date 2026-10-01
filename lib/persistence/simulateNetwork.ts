export interface SimulateNetworkOptions {
  delayMs?: [number, number];
  failRate?: number;
  errorMessage?: string;
}

export function shouldForceError(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("simulateError") === "1";
}

/**
 * Stands in for a real API round-trip: waits a randomized delay, then
 * occasionally rejects, so save/upload/submit states are genuinely
 * asynchronous and error UI is reachable without a backend.
 */
export async function simulateNetwork(options: SimulateNetworkOptions = {}): Promise<void> {
  const { delayMs = [300, 700], failRate = 0, errorMessage = "Something went wrong. Please try again." } = options;
  const [min, max] = delayMs;
  const delay = min + Math.random() * (max - min);

  await new Promise((resolve) => setTimeout(resolve, delay));

  if (shouldForceError() || Math.random() < failRate) {
    throw new Error(errorMessage);
  }
}
