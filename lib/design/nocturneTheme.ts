"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./themeScript";

export type NocturneTheme = "light" | "dark";

const CHANGE_EVENT = "ppp-theme-change";

function readStoredTheme(): NocturneTheme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): NocturneTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: NocturneTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setNocturneTheme(theme: NocturneTheme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode etc.) — still apply for this page view.
  }
  applyTheme(theme);
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  // Follow the OS live, but only while the visitor hasn't picked a theme.
  const onSystemChange = () => {
    if (readStoredTheme() === null) applyTheme(systemTheme());
  };
  // Another tab toggled the theme.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) applyTheme(readStoredTheme() ?? systemTheme());
  };
  media.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): NocturneTheme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/** The resolved theme currently applied to the document. */
export function useNocturneTheme(): NocturneTheme {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light");
}
