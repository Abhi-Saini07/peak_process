"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Gauge,
  Users,
  Check,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Menu,
  PlusCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { PeakMark } from "@/components/Logo";
import { NocturneThemeToggle } from "@/components/nocturne/NocturneThemeToggle";
import { setSidebarPreference, useSidebarPreference } from "@/lib/design/sidebarPreference";
import { getStepById, stepRegistry } from "@/lib/onboarding/steps.config";
import { useCompletionPercent, useCurrentStepId, useFullName, useStepStatuses } from "@/lib/store/selectors";
import type { StepStatus } from "@/types/onboarding";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------------ */
/* Look: Nocturne tokens (light and dark).                            */
/* ------------------------------------------------------------------ */

interface SidebarTheme {
  surface: string; // sidebar + mobile bar background, border, base text
  brand: string;
  brandSub: string;
  section: string;
  item: string;
  itemActive: string;
  control: string; // collapse / menu / close buttons
  focus: string;
  divider: string;
  backdrop: string;
  font: string;
  // Onboarding step list (shown inside the sidebar on onboarding pages)
  step: Record<StepStatus, string>;
  stepLine: string;
  stepViewing: string;
  track: string;
  fill: string;
}

// Every value is a token, so it follows light/dark mode.
// Nocturne sidebar. Layered, not boxed: the active item sits on `raised`
// with an accent edge; done steps are mint, the current one has an accent ring.
const THEME: SidebarTheme = {
  surface: "bg-nocturne-side border-nocturne-border text-nocturne-ink",
  brand: "font-nocturne-display text-nocturne-ink",
  brandSub: "text-nocturne-ink-faint",
  section: "text-nocturne-ink-faint",
  item: "font-medium text-nocturne-ink-muted hover:bg-nocturne-raised hover:text-nocturne-ink",
  itemActive:
    "bg-nocturne-raised font-semibold text-nocturne-ink shadow-[inset_3px_0_0_var(--color-nocturne-accent)]",
  control: "text-nocturne-ink-muted hover:bg-nocturne-raised hover:text-nocturne-ink",
  focus: "focus-visible:outline-nocturne-accent",
  divider: "border-nocturne-border",
  backdrop: "bg-nocturne-forest-deep/60 backdrop-blur-[2px]",
  font: "font-nocturne-ui",
  step: {
    completed: "bg-nocturne-success text-nocturne-side",
    current: "text-nocturne-accent-text ring-2 ring-nocturne-accent ring-inset",
    blocked: "text-nocturne-gold ring-[1.5px] ring-nocturne-gold ring-inset",
    upcoming: "text-nocturne-ink-faint ring-[1.5px] ring-nocturne-border-strong/50 ring-inset",
  },
  stepLine: "bg-nocturne-border",
  stepViewing: "bg-nocturne-raised font-semibold text-nocturne-ink",
  track: "bg-nocturne-surface-2",
  fill: "bg-nocturne-accent",
};

/* ------------------------------------------------------------------ */
/* Navigation model                                                   */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  external?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function useNavSections(): NavSection[] {
  const currentStepId = useCurrentStepId();
  const onboardingHref = `/onboarding/${getStepById(currentStepId).slug}`;

  return [
    {
      title: "Onboarding",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, isActive: (p) => p === "/dashboard" },
        { label: "Onboarding", href: onboardingHref, icon: ClipboardList, isActive: (p) => p.startsWith("/onboarding") },
      ],
    },
    {
      title: "Recruitment",
      items: [
        { label: "Dashboard", href: "/admin", icon: Gauge, isActive: (p) => p === "/admin" },
        {
          label: "Job postings",
          href: "/admin/jobs",
          icon: Briefcase,
          isActive: (p) => (p.startsWith("/admin/jobs") || p.startsWith("/admin/applications")) && p !== "/admin/jobs/new",
        },
        { label: "Post a job", href: "/admin/jobs/new", icon: PlusCircle, isActive: (p) => p === "/admin/jobs/new" },
        { label: "Employees", href: "/admin/employees", icon: Users, isActive: (p) => p.startsWith("/admin/employees") },
      ],
    },
  ];
}

const CAREERS_ITEM: NavItem = {
  label: "Careers site",
  href: "/jobs",
  icon: ExternalLink,
  isActive: () => false,
  external: true,
};

/* ------------------------------------------------------------------ */
/* Pieces                                                             */
/* ------------------------------------------------------------------ */

function Brand({ theme, compact }: { theme: SidebarTheme; compact: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label={compact ? "Peak Process Partners — dashboard" : undefined}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
        theme.focus,
      )}
    >
      <PeakMark className="size-8 shrink-0" />
      {!compact && (
        <span className={cn("min-w-0 truncate text-base font-semibold tracking-[-0.02em]", theme.brand)}>
          Peak Process
          <span className="sr-only"> Partners</span>
        </span>
      )}
    </Link>
  );
}

function NavLink({
  item,
  theme,
  compact,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  theme: SidebarTheme;
  compact: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = item.isActive(pathname);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={compact ? item.label : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-nocturne-control text-sm transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
        compact ? "justify-center px-0" : "px-3",
        active ? theme.itemActive : theme.item,
        theme.focus,
      )}
    >
      <Icon className="size-[1.125rem] shrink-0" aria-hidden />
      <span className={compact ? "sr-only" : "truncate"}>{item.label}</span>
    </Link>
  );
}

const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  completed: "complete",
  current: "in progress",
  blocked: "in progress",
  upcoming: "not started",
};

/** The onboarding steps and progress, nested under "Onboarding" while on an
 *  onboarding page. Replaces the separate step rail the page shells used to
 *  render, so there is one navigation column instead of two. */
function OnboardingSteps({
  theme,
  compact,
  pathname,
  onNavigate,
}: {
  theme: SidebarTheme;
  compact: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const statuses = useStepStatuses();
  const percent = useCompletionPercent();

  return (
    <div className={cn(compact ? "mt-2" : "mt-3 mb-1 ml-5 border-l pl-3", theme.divider)}>
      {!compact && (
        <div className="mb-3 pr-1">
          <div className={cn("flex items-baseline justify-between text-[0.6875rem] font-bold tracking-[0.12em] uppercase", theme.section)}>
            <span>Progress</span>
            <span className="font-nocturne-mono tracking-normal text-nocturne-accent-text">{percent}%</span>
          </div>
          <div
            className={cn("mt-1.5 h-1 overflow-hidden rounded-full", theme.track)}
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={cn("h-full rounded-full transition-[width] duration-500", theme.fill)} style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
      <ol aria-label="Onboarding steps" className={cn("flex flex-col", compact ? "items-center gap-1.5" : "gap-0.5")}>
        {stepRegistry.map((step, index) => {
          const status = statuses[step.id] ?? "upcoming";
          const href = `/onboarding/${step.slug}`;
          const viewing = pathname === href;
          const marker = (
            <span
              aria-hidden
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold tabular-nums",
                compact ? "size-7" : "size-5",
                theme.step[status],
              )}
            >
              {status === "completed" ? <Check className={compact ? "size-3.5" : "size-3"} strokeWidth={3} /> : index + 1}
            </span>
          );
          return (
            <li key={step.id}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={viewing ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.label}, ${STEP_STATUS_LABEL[status]}`}
                title={compact ? `${index + 1}. ${step.label}` : undefined}
                className={cn(
                  "flex items-center rounded-lg text-[0.8125rem] transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
                  compact ? "size-9 justify-center" : "h-8 gap-2.5 px-2",
                  viewing ? theme.stepViewing : theme.item,
                  theme.focus,
                )}
              >
                {marker}
                {!compact && <span className="truncate">{step.shortLabel}</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function NavBody({
  theme,
  compact,
  pathname,
  onNavigate,
  footer,
}: {
  theme: SidebarTheme;
  compact: boolean;
  pathname: string;
  onNavigate?: () => void;
  footer?: ReactNode;
}) {
  const sections = useNavSections();
  const fullName = useFullName();
  const showName = Boolean(fullName) && !compact && (pathname === "/dashboard" || pathname.startsWith("/onboarding"));
  return (
    <>
      <nav aria-label="Main" className="mt-8 flex flex-1 flex-col gap-7 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            {compact ? (
              <div aria-hidden className={cn("mx-2 mb-3 border-t", theme.divider)} />
            ) : (
              <p className={cn("mb-2 px-3 text-[0.6875rem] font-bold tracking-[0.14em] uppercase", theme.section)}>
                {section.title}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.label}>
                  <NavLink item={item} theme={theme} compact={compact} pathname={pathname} onNavigate={onNavigate} />
                  {item.label === "Onboarding" && pathname.startsWith("/onboarding/") && (
                    <OnboardingSteps theme={theme} compact={compact} pathname={pathname} onNavigate={onNavigate} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className={cn("mt-6 flex flex-col gap-1 border-t pt-4", theme.divider)}>
        {showName && (
          <div className="mb-2 px-3">
            <p className={cn("text-[0.6875rem] font-bold tracking-[0.14em] uppercase", theme.section)}>Signed in as</p>
            <p className="mt-0.5 truncate text-sm font-medium">{fullName}</p>
          </div>
        )}
        <NavLink item={CAREERS_ITEM} theme={theme} compact={compact} pathname={pathname} onNavigate={onNavigate} />
        {footer}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                            */
/* ------------------------------------------------------------------ */

/**
 * App navigation for internal pages (dashboard, onboarding, HR admin).
 * On onboarding pages it also carries the step list and progress, so the
 * page shells no longer render a step rail of their own on desktop.
 * Desktop: a sticky left sidebar that collapses to an icon rail.
 * Below the tablet breakpoint: a slim top bar whose menu button opens the
 * same navigation as a slide-in drawer. Styles come from the Nocturne tokens.
 */
export function AppSidebar() {
  const theme = THEME;
  const pathname = usePathname();
  const preference = useSidebarPreference();
  const collapsed = preference === "collapsed";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const drawerId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeDrawer() {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }

  // While the drawer is open: lock page scroll and move focus into it.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  // Keep keyboard focus inside the open drawer; Escape closes it.
  function onDrawerKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDrawer();
      return;
    }
    if (e.key !== "Tab" || !drawerRef.current) return;
    const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const controlClass = cn(
    "inline-flex items-center justify-center rounded-nocturne-control transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
    theme.control,
    theme.focus,
  );

  return (
    <>
      {/* Mobile / small tablet: top bar with menu button. */}
      <div className={cn("flex items-center gap-3 border-b px-3 py-2.5 tablet:hidden", theme.surface, theme.font)}>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls={drawerId}
          aria-label="Open navigation menu"
          className={cn(controlClass, "size-10")}
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <Brand theme={theme} compact={false} />
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <div className={cn("fixed inset-0 z-[90] tablet:hidden", theme.font)}>
            <motion.div
              aria-hidden
              className={cn("absolute inset-0", theme.backdrop)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              onClick={closeDrawer}
            />
            <motion.div
              ref={drawerRef}
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              onKeyDown={onDrawerKeyDown}
              className={cn(
                "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r px-4 pt-4 pb-5 shadow-nocturne-menu",
                theme.surface,
              )}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between gap-3">
                <Brand theme={theme} compact={false} />
                <button type="button" onClick={closeDrawer} aria-label="Close navigation menu" className={cn(controlClass, "size-10 shrink-0")}>
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <NavBody
                theme={theme}
                compact={false}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
                footer={
                  <div className="mt-1 flex items-center justify-between gap-3 pl-3">
                    <span className={cn("text-sm font-medium", theme.section)}>Theme</span>
                    <NocturneThemeToggle />
                  </div>
                }
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop: sticky sidebar. */}
      <aside
        aria-label="App navigation"
        className={cn(
          "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r py-6 transition-[width] duration-200 ease-out motion-reduce:transition-none tablet:flex",
          collapsed ? "w-[4.5rem] px-3" : "w-64 px-4",
          theme.surface,
          theme.font,
        )}
      >
        <div className={cn("flex", collapsed ? "justify-center" : "px-1")}>
          <Brand theme={theme} compact={collapsed} />
        </div>
        <NavBody
          theme={theme}
          compact={collapsed}
          pathname={pathname}
          footer={
            <div className={cn("flex gap-2", collapsed ? "flex-col-reverse items-center" : "items-center")}>
              <button
                type="button"
                onClick={() => setSidebarPreference(collapsed ? "expanded" : "collapsed")}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  controlClass,
                  "h-10 gap-3 text-sm font-medium",
                  collapsed ? "w-10 justify-center" : "min-w-0 flex-1 justify-start px-3",
                )}
              >
                {collapsed ? (
                  <ChevronsRight className="size-[1.125rem]" aria-hidden />
                ) : (
                  <>
                    <ChevronsLeft className="size-[1.125rem]" aria-hidden />
                    <span>Collapse</span>
                  </>
                )}
              </button>
              <NocturneThemeToggle />
            </div>
          }
        />
      </aside>
    </>
  );
}
