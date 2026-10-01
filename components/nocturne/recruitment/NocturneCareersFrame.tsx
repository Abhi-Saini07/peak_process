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
 * Page chrome shared by every public careers screen in the Nocturne design:
 * brand lockup, the site nav (Careers is the only public section) and the
 * light/dark toggle. The theme itself is global (data-theme on <html>). On
 * route changes the page fades and slides in the navigation direction; the
 * header has its own view-transition-name so it stays pinned (see
 * globals.css). `skeleton` marks the loading placeholder so it hands off to
 * the real page with a quick fade instead of a slide.
 */
export function NocturneCareersFrame({ children, skeleton = false }: { children: ReactNode; skeleton?: boolean }) {
  return (
    // The ViewTransition must wrap the outermost DOM node: React only runs
    // enter/exit for boundaries that aren't inside freshly inserted DOM.
    <ViewTransition enter={pageEnter} exit={skeleton ? skeletonExit : pageExit} default="none">
      <div className="min-h-screen overflow-x-clip bg-nocturne-bg font-nocturne-ui text-nocturne-ink">
        <header
          className="border-b border-nocturne-border bg-nocturne-card in-data-[theme=dark]:bg-nocturne-bg"
          style={{ viewTransitionName: "nocturne-careers-header" }}
        >
          <div className={`${careersContainer} flex h-15 items-center justify-between gap-4 sm:h-18`}>
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
              <span className="truncate text-[0.9375rem] font-semibold text-nocturne-ink sm:sr-only">Careers</span>
            </Link>
            <div className="flex shrink-0 items-center gap-3 sm:gap-7">
              <nav aria-label="Site" className="max-sm:hidden">
                <Link
                  href="/jobs"
                  transitionTypes={NAV_BACK}
                  className="rounded-nocturne-control text-sm font-semibold text-nocturne-ink transition-colors hover:text-nocturne-accent-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nocturne-accent"
                >
                  Careers
                </Link>
              </nav>
              <NocturneThemeToggle className="size-9.5" />
            </div>
          </div>
        </header>
        {children}
      </div>
    </ViewTransition>
  );
}
