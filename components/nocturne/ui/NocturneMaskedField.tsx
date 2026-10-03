"use client";

import { useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NocturneFieldWrapper } from "./NocturneFieldWrapper";
import { nocturneFieldHeightClass, nocturneFieldInputVariants } from "./nocturneFieldStyles";

interface NocturneMaskedFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullLength: number;
  placeholder?: string;
  /** Display-only (admin views): never editable, masking still applies. */
  readOnly?: boolean;
  /** Start unmasked (e.g. right after an audited reveal). */
  defaultRevealed?: boolean;
  /** Show the eye button to toggle the mask (default true). */
  allowToggle?: boolean;
}

function maskValue(value: string, fullLength: number): string {
  const visible = value.slice(-4);
  const hiddenGroups = Math.max(0, Math.ceil((fullLength - 4) / 4));
  return `${"•••• ".repeat(hiddenGroups)}${visible}`;
}

export function NocturneMaskedField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  helperText,
  required,
  fullLength,
  placeholder,
  readOnly = false,
  defaultRevealed = false,
  allowToggle = true,
}: NocturneMaskedFieldProps<T>) {
  const [revealed, setRevealed] = useState(defaultRevealed);
  const [focused, setFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value: string = field.value ?? "";
        const isComplete = value.replace(/\s/g, "").length >= fullLength;
        const shouldMask = isComplete && !focused && !revealed;

        return (
          <NocturneFieldWrapper label={label} htmlFor={name} required={required} error={error} helperText={helperText}>
            <div className="relative">
              <input
                id={name}
                name={field.name}
                ref={field.ref}
                placeholder={placeholder}
                value={shouldMask ? maskValue(value, fullLength) : value}
                onChange={(e) => field.onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  field.onBlur();
                }}
                readOnly={readOnly || shouldMask}
                className={cn(
                  nocturneFieldInputVariants({ hasError: Boolean(error) }),
                  nocturneFieldHeightClass,
                  "nocturne-mono pr-11 tracking-wide",
                )}
                aria-invalid={Boolean(error)}
              />
              {isComplete && allowToggle && (
                <button
                  type="button"
                  onClick={() => setRevealed((r) => !r)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-nocturne-ink-faint transition-colors hover:text-nocturne-ink-muted"
                  aria-label={revealed ? "Hide number" : "Reveal number"}
                >
                  {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              )}
            </div>
          </NocturneFieldWrapper>
        );
      }}
    />
  );
}
