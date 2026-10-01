"use client";

import { Moon, Sun } from "lucide-react";
import { setNocturneTheme, useNocturneTheme } from "@/lib/design/nocturneTheme";
import { cn } from "@/lib/utils/cn";

/** Sun/moon switch for the Nocturne light/dark palettes. Both icons stay
 *  mounted and cross-fade/rotate so the swap reads as one control. */
export function NocturneThemeToggle({ className }: { className?: string }) {
  const theme = useNocturneTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setNocturneTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-nocturne-control border border-nocturne-border bg-nocturne-card text-nocturne-ink-muted shadow-nocturne-rest transition-colors duration-150 hover:border-nocturne-border-strong hover:bg-nocturne-raised hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent",
        className,
      )}
    >
      <Sun
        aria-hidden
        className={cn(
          "absolute size-[1.125rem] transition-all duration-300 ease-out motion-reduce:transition-none",
          isDark ? "scale-50 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
      />
      <Moon
        aria-hidden
        className={cn(
          "absolute size-[1.125rem] transition-all duration-300 ease-out motion-reduce:transition-none",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0",
        )}
      />
    </button>
  );
}
