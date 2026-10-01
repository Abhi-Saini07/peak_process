const NAMESPACE = "ppp-onboarding";
const VERSION = "v1";

function key(name: string): string {
  return `${NAMESPACE}:${VERSION}:${name}`;
}

/** SSR-safe localStorage wrapper. Read failures fall back to null rather than throwing. */
export const storageAdapter = {
  read<T>(name: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(key(name));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  write<T>(name: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key(name), JSON.stringify(value));
    } catch {
      // Storage full or unavailable (private browsing) — fail silently, autosave
      // will surface an error state on the next save attempt instead.
    }
  },

  remove(name: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key(name));
  },
};
