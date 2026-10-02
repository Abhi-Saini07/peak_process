"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ApplicationsViewMode = "list" | "board";

const STORAGE_KEY = "ppp-applications-view";
const CHANGE_EVENT = "ppp-applications-view-change";

/** Fallback for when storage throws: the choice lasts until a full reload. */
let memoryMode: ApplicationsViewMode | null = null;

function read(): ApplicationsViewMode {
  if (memoryMode) return memoryMode;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "board" ? "board" : "list";
  } catch {
    return "list";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** List | Board, remembered per browser. Storage can be blocked (private
 *  windows, cleared site data), so reads and writes fall back quietly and the
 *  server render always starts on "list". */
export function useApplicationsViewMode() {
  const mode = useSyncExternalStore(subscribe, read, () => "list" as const);

  const setMode = useCallback((next: ApplicationsViewMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      memoryMode = null;
    } catch {
      // Not remembered across reloads, but the switch still happens.
      memoryMode = next;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { mode, setMode };
}
