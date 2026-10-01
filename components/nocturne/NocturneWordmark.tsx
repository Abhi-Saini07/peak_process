import { PeakMark } from "@/components/Logo";
import { cn } from "@/lib/utils/cn";

/** Same brand mark as the other two designs, paired with Nocturne's own
 *  Newsreader italic lockup instead of Design 1's Lora or Dark's Space Grotesk.
 *  `subtitle` names the product area (onboarding flow vs. careers site). */
export function NocturneWordmark({
  className,
  subtitle = "Employee Onboarding",
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PeakMark className="size-9 shrink-0" />
      <div className="min-w-0 leading-tight">
        <div className="font-nocturne-display truncate text-base font-semibold italic text-nocturne-ink">
          Peak Process Partners
        </div>
        <div className="mt-0.5 truncate text-[0.6875rem] font-medium tracking-widest text-nocturne-ink-faint uppercase">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
