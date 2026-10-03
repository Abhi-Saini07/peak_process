import { Clock, Link2Off, ShieldCheck } from "lucide-react";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import { careersContainer, glowPanelClass, heroGlowClass } from "@/components/nocturne/recruitment/careersUi";
import { cn } from "@/lib/utils/cn";

export type OnboardingLinkStatus = "invalid" | "expired" | "used";

const COPY: Record<OnboardingLinkStatus, { icon: typeof Clock; eyebrow: string; title: string; body: string }> = {
  expired: {
    icon: Clock,
    eyebrow: "Link expired",
    title: "This onboarding link has expired.",
    body: "Onboarding links work for 14 days. Reply to your offer email or contact our HR team and we'll send you a new one.",
  },
  used: {
    icon: ShieldCheck,
    eyebrow: "Link already used",
    title: "This link has already been used.",
    body: "For your security each link works once, on the first browser that opens it. If that wasn't you, or you've switched devices, ask our HR team for a new link.",
  },
  invalid: {
    icon: Link2Off,
    eyebrow: "Link not recognised",
    title: "We couldn't find this onboarding link.",
    body: "Check that you copied the whole link from your email. If it still doesn't work, contact our HR team for a new one.",
  },
};

/** Friendly dead ends for /onboarding/start/[token]. */
export function OnboardingLinkStatusNocturne({ status }: { status: OnboardingLinkStatus }) {
  const copy = COPY[status];
  const Icon = copy.icon;
  return (
    <NocturneCareersFrame>
      <main className={heroGlowClass}>
        <div className={`${careersContainer} flex flex-col items-center pt-10 pb-20 sm:pt-16 sm:pb-28`}>
          <div className={cn(glowPanelClass, "flex w-full max-w-[36rem] flex-col items-center px-5 py-9 text-center sm:px-10 sm:py-11")}>
            <span className="flex size-14 items-center justify-center rounded-full bg-nocturne-gold-tint text-nocturne-gold">
              <Icon className="size-6.5" aria-hidden />
            </span>
            <p className="nocturne-type-eyebrow mt-6 text-nocturne-gold">{copy.eyebrow}</p>
            <h1 className="mt-2.5 font-nocturne-display text-[clamp(1.625rem,1.3rem+1.4vw,2.25rem)] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-nocturne-ink">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">{copy.body}</p>
          </div>
        </div>
      </main>
    </NocturneCareersFrame>
  );
}
