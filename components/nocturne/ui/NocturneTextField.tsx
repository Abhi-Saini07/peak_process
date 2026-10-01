import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { NocturneFieldWrapper } from "./NocturneFieldWrapper";
import { nocturneFieldHeightClass, nocturneFieldInputVariants } from "./nocturneFieldStyles";

interface NocturneTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const NocturneTextField = forwardRef<HTMLInputElement, NocturneTextFieldProps>(function NocturneTextField(
  { label, error, helperText, required, id, name, className, ...props },
  ref,
) {
  const inputId = id ?? name;
  return (
    <NocturneFieldWrapper
      label={label}
      htmlFor={inputId ?? label}
      required={required}
      error={error}
      helperText={helperText}
    >
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={cn(nocturneFieldInputVariants({ hasError: Boolean(error) }), nocturneFieldHeightClass, className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </NocturneFieldWrapper>
  );
});
