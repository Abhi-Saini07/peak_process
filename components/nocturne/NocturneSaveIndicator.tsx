"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CloudCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import { useSaveMeta } from "@/lib/store/selectors";

/** Mono status line for the top-right of step pages. `idleLabel` shows
 *  before anything has been saved this session. */
export function NocturneSaveIndicator({
  className,
  idleLabel = "Not yet saved",
}: {
  className?: string;
  idleLabel?: string;
}) {
  const { saveStatus, saveError, lastSavedAt } = useSaveMeta();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  let content: React.ReactNode;
  if (saveStatus === "saving") {
    content = (
      <span className="flex items-center gap-1.5 text-nocturne-ink-faint">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-nocturne-accent opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-nocturne-accent" />
        </span>
        Saving{"…"}
      </span>
    );
  } else if (saveStatus === "error") {
    content = (
      <span className="flex items-center gap-1.5 text-nocturne-error">
        <CircleAlert className="size-3.5" />
        {saveError ?? "Couldn’t save"}
      </span>
    );
  } else if (lastSavedAt) {
    content = (
      <span className="flex items-center gap-1.5 text-nocturne-ink-faint">
        <CloudCheck className="size-3.5 text-nocturne-success" />
        Saved {formatRelativeTime(lastSavedAt)}
      </span>
    );
  } else {
    // Plain sans for the idle hint; mono is reserved for the live status.
    content = <span className="font-nocturne-sans text-[0.8125rem] text-nocturne-ink-muted">{idleLabel}</span>;
  }

  return <div className={cn("font-nocturne-mono text-xs", className)}>{content}</div>;
}
