/** The public /schedule/[token] page: dead ends here, the interactive panels in ScheduleInterviewPanels. */
import { CalendarX2, Clock, Link2Off } from "lucide-react";
import type { ScheduleState } from "@/lib/server/interviewRepository";
import { BookedInterview, SlotPicker } from "@/components/nocturne/recruitment/ScheduleInterviewPanels";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import { careersContainer, glowPanelClass, heroGlowClass } from "@/components/nocturne/recruitment/careersUi";
import { cn } from "@/lib/utils/cn";

const scheduleTitleClass =
  "mt-2.5 font-nocturne-display text-[clamp(1.5rem,1.25rem+1.2vw,2.125rem)] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-nocturne-ink";

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <NocturneCareersFrame>
      <main className={heroGlowClass}>
        <div className={`${careersContainer} flex flex-col items-center pt-10 pb-20 sm:pt-16 sm:pb-28`}>
          <div className={cn(glowPanelClass, "flex w-full flex-col px-5 py-8 sm:px-10 sm:py-10", wide ? "max-w-[44rem]" : "max-w-[36rem]")}>
            {children}
          </div>
        </div>
      </main>
    </NocturneCareersFrame>
  );
}

function ScheduleBadge({ icon: Icon }: { icon: typeof Clock }) {
  return (
    <span className="flex size-12 items-center justify-center rounded-full bg-nocturne-gold-tint text-nocturne-gold">
      <Icon className="size-5.5" aria-hidden />
    </span>
  );
}

const DEAD_ENDS = {
  invalid: { icon: Link2Off, eyebrow: "Link not recognised", title: "We couldn't find this scheduling link.", body: "Check that you copied the whole link from your email, or reply to it and we'll send a new one." },
  expired: { icon: Clock, eyebrow: "Link expired", title: "The dates on this link have passed.", body: "Reply to your invitation email and we'll send you new times." },
  cancelled: { icon: CalendarX2, eyebrow: "Interview cancelled", title: "This interview is cancelled.", body: "If you'd still like to talk, reply to your invitation email and we'll find another time." },
} as const;

export function ScheduleInterviewNocturne({ token, state }: { token: string; state: ScheduleState }) {
  if (state.kind === "pending") {
    return (
      <Shell wide>
        <SlotPicker token={token} state={state} />
      </Shell>
    );
  }
  if (state.kind === "booked") {
    return (
      <Shell>
        <BookedInterview token={token} state={state} />
      </Shell>
    );
  }
  const copy = DEAD_ENDS[state.kind];
  return (
    <Shell>
      <div className="flex flex-col items-center text-center">
        <ScheduleBadge icon={copy.icon} />
        <p className="nocturne-type-eyebrow mt-6 text-nocturne-gold">{copy.eyebrow}</p>
        <h1 className={scheduleTitleClass}>{copy.title}</h1>
        {"jobTitle" in state && <p className="mt-2 text-sm font-semibold text-nocturne-ink">{state.jobTitle}</p>}
        <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">{copy.body}</p>
      </div>
    </Shell>
  );
}

