"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the app sidebar is collapsed to an icon rail. `null` means the
 * visitor hasn't chosen yet (the sidebar is then expanded).
 * Stored in localStorage only — purely a presentation preference.
 */
export type SidebarPreference = "expanded" | "collapsed" | null;

const STORAGE_KEY = "ppp-sidebar";
const CHANGE_EVENT = "ppp-sidebar-change";

function read(): SidebarPreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "expanded" || value === "collapsed" ? value : null;
  } catch {
    return null;
  }
}

export function setSidebarPreference(value: Exclude<SidebarPreference, null>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked — the choice still applies until the next page load.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSidebarPreference(): SidebarPreference {
  // Server snapshot is `null` so server and first client render agree.
  return useSyncExternalStore(subscribe, read, () => null);
}
