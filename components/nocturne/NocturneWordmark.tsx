import { PeakMark } from "@/components/Logo";
import { cn } from "@/lib/utils/cn";

/** The Peak mark with the Nocturne lockup: company name in Sora, product
 *  area as a small uppercase eyebrow. `subtitle` names the product area
 *  (onboarding flow vs. careers site). */
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
        <div className="font-nocturne-display truncate text-[0.9375rem] font-semibold tracking-[-0.01em] text-nocturne-ink">
          Peak Process Partners
        </div>
        <div className="mt-0.5 truncate text-[0.6875rem] font-semibold tracking-[0.12em] text-nocturne-ink-faint uppercase">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
