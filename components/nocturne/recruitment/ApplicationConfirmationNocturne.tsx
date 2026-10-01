import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import { NAV_BACK, careersContainer, glowPanelClass, heroGlowClass } from "@/components/nocturne/recruitment/careersUi";
import { nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import { cn } from "@/lib/utils/cn";

export function ApplicationConfirmationNocturne({ jobTitle, reference }: { jobTitle: string; reference: string }) {
  return (
    <NocturneCareersFrame>
      <main className={heroGlowClass}>
        <div className={`${careersContainer} flex flex-col items-center pt-10 pb-20 sm:pt-16 sm:pb-28`}>
          <div className={cn(glowPanelClass, "flex w-full max-w-[36rem] flex-col items-center px-5 py-9 text-center sm:px-10 sm:py-11")}>
            <span className="flex size-14 items-center justify-center rounded-full bg-nocturne-success-tint text-nocturne-success ring-6 ring-nocturne-success-tint/50">
              <Check className="size-6.5" strokeWidth={2.5} aria-hidden />
            </span>
            <p className="nocturne-type-eyebrow mt-6 text-nocturne-success">Application received</p>
            <h1 className="mt-2.5 font-nocturne-display text-[clamp(1.625rem,1.3rem+1.4vw,2.25rem)] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-nocturne-ink">
              Thank you for applying for {jobTitle}.
            </h1>
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">
              Your application has been successfully submitted. Our recruitment team will review your application and
              contact you if there are further steps.
            </p>

            {reference && (
              <div className="mt-7 w-full max-w-xs rounded-nocturne-control border border-nocturne-border bg-nocturne-raised px-5 py-3.5">
                <p className="nocturne-type-eyebrow text-nocturne-ink-muted">Application reference</p>
                <p className="mt-1.5 nocturne-mono text-lg font-semibold tracking-wide text-nocturne-ink">{reference}</p>
              </div>
            )}

            <Link
              href="/jobs"
              transitionTypes={NAV_BACK}
              className={`${nocturneButtonVariants({ variant: "primary" })} mt-8 max-sm:w-full`}
            >
              Browse more positions
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </main>
    </NocturneCareersFrame>
  );
}
