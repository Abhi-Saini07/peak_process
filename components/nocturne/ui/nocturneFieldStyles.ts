import { cva } from "class-variance-authority";

/** Nocturne form control: white field on light cards, a well of the page
 *  colour on dark cards (`in-data-[theme=dark]`), hairline strong border and
 *  an accent ring plus soft glow on focus. */
export const nocturneFieldInputVariants = cva(
  "w-full rounded-nocturne-control border bg-nocturne-card px-3.5 text-[0.9375rem] text-nocturne-ink placeholder:text-nocturne-ink-faint transition-[border-color,box-shadow,background-color] duration-150 outline-none in-data-[theme=dark]:bg-nocturne-bg disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      hasError: {
        true: "border-nocturne-error focus:border-nocturne-error focus:ring-3 focus:ring-nocturne-error/20",
        false:
          "border-nocturne-border-strong hover:border-nocturne-ink-muted focus:border-nocturne-accent focus:shadow-nocturne-glow focus:ring-3 focus:ring-nocturne-accent/20",
      },
    },
    defaultVariants: { hasError: false },
  },
);

export const nocturneFieldHeightClass = "h-11";
