import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import { PeakMark } from "@/components/Logo";
import { NocturneThemeToggle } from "@/components/nocturne/NocturneThemeToggle";
import { NAV_BACK, careersContainer } from "@/components/nocturne/recruitment/careersUi";

const navTransition = {
  "nocturne-nav-forward": "nocturne-nav-forward",
  "nocturne-nav-back": "nocturne-nav-back",
};
// Real pages fade up when they appear without a direction (skeleton reveal,
// browser back/forward); skeletons fade out quickly when content replaces them.
const pageEnter = { ...navTransition, default: "nocturne-reveal-in" };
const pageExit = { ...navTransition, default: "none" };
const skeletonExit = { ...navTransition, default: "nocturne-reveal-out" };

/**
 * Page chrome shared by every public careers screen in the Nocturne design.
 * `data-nocturne-surface` opts the page into the Nocturne light/dark token
 * swap defined in app/globals.css. On route changes the page fades and
 * slides in the navigation direction; the header has its own
 * view-transition-name so it stays pinned (see globals.css). `skeleton`
 * marks the loading placeholder so it hands off to the real page with a
 * quick fade instead of a slide.
 */
export function NocturneCareersFrame({ children, skeleton = false }: { children: ReactNode; skeleton?: boolean }) {
  return (
    // The ViewTransition must wrap the outermost DOM node: React only runs
    // enter/exit for boundaries that aren't inside freshly inserted DOM.
    <ViewTransition enter={pageEnter} exit={skeleton ? skeletonExit : pageExit} default="none">
      <div data-nocturne-surface="" className="min-h-screen bg-nocturne-bg font-nocturne-ui text-nocturne-ink">
        <header
          className="border-b border-nocturne-border bg-nocturne-card"
          style={{ viewTransitionName: "nocturne-careers-header" }}
        >
          <div className={`${careersContainer} flex h-15 items-center justify-between gap-4 sm:h-17`}>
            <Link
              href="/jobs"
              transitionTypes={NAV_BACK}
              className="flex min-w-0 items-center gap-2.5 rounded-nocturne-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nocturne-accent sm:gap-3"
            >
              <PeakMark className="size-7 shrink-0 sm:size-8" />
              {/* On phones the lockup shortens to mark + "Careers" (the name stays for screen readers). */}
              <span className="truncate text-base font-bold tracking-[-0.01em] text-nocturne-ink max-sm:sr-only">
                Peak Process Partners
              </span>
              <span aria-hidden className="h-5.5 w-px shrink-0 bg-nocturne-border max-sm:hidden" />
              <span className="truncate text-[0.9375rem] font-semibold text-nocturne-ink sm:font-medium sm:text-nocturne-ink-muted">
                Careers
              </span>
            </Link>
            <NocturneThemeToggle className="size-9" />
          </div>
        </header>
        {children}
      </div>
    </ViewTransition>
  );
}
