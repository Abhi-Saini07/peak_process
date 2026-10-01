import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NocturneFieldWrapper } from "./NocturneFieldWrapper";
import { nocturneFieldHeightClass, nocturneFieldInputVariants } from "./nocturneFieldStyles";

interface NocturneSelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const NocturneSelectField = forwardRef<HTMLSelectElement, NocturneSelectFieldProps>(function NocturneSelectField(
  { label, error, helperText, required, id, name, className, options, placeholder = "Select…", ...props },
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
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          name={name}
          className={cn(
            nocturneFieldInputVariants({ hasError: Boolean(error) }),
            nocturneFieldHeightClass,
            "appearance-none pr-9",
            className,
          )}
          aria-invalid={Boolean(error)}
          defaultValue=""
          {...props}
        >
          <option value="" disabled className="text-nocturne-ink-faint">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-nocturne-ink">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-nocturne-ink-faint"
          aria-hidden
        />
      </div>
    </NocturneFieldWrapper>
  );
});
