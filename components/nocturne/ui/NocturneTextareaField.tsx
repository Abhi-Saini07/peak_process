import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { NocturneFieldWrapper } from "./NocturneFieldWrapper";
import { nocturneFieldInputVariants } from "./nocturneFieldStyles";

interface NocturneTextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const NocturneTextareaField = forwardRef<HTMLTextAreaElement, NocturneTextareaFieldProps>(
  function NocturneTextareaField({ label, error, helperText, required, id, name, className, rows = 3, ...props }, ref) {
    const inputId = id ?? name;
    return (
      <NocturneFieldWrapper
        label={label}
        htmlFor={inputId ?? label}
        required={required}
        error={error}
        helperText={helperText}
      >
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          rows={rows}
          className={cn(nocturneFieldInputVariants({ hasError: Boolean(error) }), "resize-none py-3", className)}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </NocturneFieldWrapper>
    );
  },
);
