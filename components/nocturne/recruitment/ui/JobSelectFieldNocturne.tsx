import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NocturneFieldWrapper } from "@/components/nocturne/ui/NocturneFieldWrapper";
import { nocturneFieldHeightClass, nocturneFieldInputVariants } from "@/components/nocturne/ui/nocturneFieldStyles";

interface JobSelectFieldNocturneProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: readonly { value: string; label: string }[];
}

/** No empty placeholder — see JobSelectField (Current) for why. */
export const JobSelectFieldNocturne = forwardRef<HTMLSelectElement, JobSelectFieldNocturneProps>(
  function JobSelectFieldNocturne({ label, error, helperText, required, id, name, className, options, ...props }, ref) {
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
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
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
  },
);
