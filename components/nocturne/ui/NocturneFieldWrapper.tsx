import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface NocturneFieldWrapperProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function NocturneFieldWrapper({
  label,
  htmlFor,
  required,
  helperText,
  error,
  children,
  className,
}: NocturneFieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-semibold text-nocturne-ink">
        {label}
        {required && <span className="ml-1 text-nocturne-accent-text">*</span>}
      </label>
      {children}
      <p
        className={cn(
          "min-h-4.25 text-[0.8125rem] leading-snug",
          error ? "text-nocturne-error" : "text-nocturne-ink-faint",
        )}
        role={error ? "alert" : undefined}
      >
        {error || helperText || " "}
      </p>
    </div>
  );
}
