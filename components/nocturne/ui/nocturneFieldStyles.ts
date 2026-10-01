import { cva } from "class-variance-authority";

export const nocturneFieldInputVariants = cva(
  "w-full rounded-nocturne-control border bg-nocturne-card px-3.5 text-[0.9375rem] text-nocturne-ink placeholder:text-nocturne-ink-faint transition-colors duration-150 outline-none disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      hasError: {
        true: "border-nocturne-error focus:border-nocturne-error focus:ring-3 focus:ring-nocturne-error/20",
        false: "border-nocturne-border-strong hover:border-nocturne-ink-muted focus:border-nocturne-accent focus:ring-3 focus:ring-nocturne-accent/20",
      },
    },
    defaultVariants: { hasError: false },
  },
);

export const nocturneFieldHeightClass = "h-11";
