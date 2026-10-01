import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface NocturneFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  first?: boolean;
}

/** A titled group of fields inside a step's work card; sections after the
 *  first are separated by a hairline rule. */
export function NocturneFormSection({ title, description, children, className, first }: NocturneFormSectionProps) {
  return (
    <section className={cn(!first && "mt-6 border-t border-nocturne-border pt-6", className)}>
      <div className="mb-4">
        <h2 className="font-nocturne-display text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] text-nocturne-ink">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-[0.8125rem] text-nocturne-ink-muted">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}
