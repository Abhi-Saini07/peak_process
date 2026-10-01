"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface FilterOption {
  value: string;
  label: string;
}

interface NocturneFilterSelectProps {
  /** Accessible name (visually hidden — the trigger shows the current value). */
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** Classes for the trigger (shared filter-control look). */
  triggerClassName?: string;
  className?: string;
}

/**
 * Animated replacement for a native <select> in the jobs filters.
 * Implements the WAI-ARIA "select-only combobox" pattern: focus stays on
 * the trigger, the highlighted option is exposed via aria-activedescendant,
 * and the keyboard behaves like a native select (arrows, Home/End,
 * Enter/Space, Escape, Tab, type-to-jump).
 */
export function NocturneFilterSelect({
  label,
  value,
  options,
  onChange,
  triggerClassName,
  className,
}: NocturneFilterSelectProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const valueId = `${id}-value`;
  const optionId = (index: number) => `${id}-opt-${index}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selected = options[selectedIndex];

  function openMenu(index = selectedIndex) {
    setActiveIndex(index);
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    setOpen(false);
  }

  // Close when clicking or tapping anywhere outside the control.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option visible when the list scrolls.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function jumpToTyped(char: string) {
    const now = Date.now();
    const t = typeahead.current;
    t.text = now - t.at > 600 ? char : t.text + char;
    t.at = now;
    const query = t.text.toLowerCase();
    const start = open ? activeIndex + 1 : selectedIndex + 1;
    const ordered = [...options.slice(start), ...options.slice(0, start)];
    const match = ordered.find((o) => o.label.toLowerCase().startsWith(query));
    if (!match) return;
    const index = options.indexOf(match);
    if (open) setActiveIndex(index);
    else commit(index);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(last);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) commit(activeIndex);
        else openMenu();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        if (open) setOpen(false);
        break;
      default:
        if (e.key.length === 1 && e.key !== " " && !e.metaKey && !e.ctrlKey && !e.altKey) jumpToTyped(e.key);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn("flex items-center justify-between gap-2 px-4 text-left", triggerClassName)}
      >
        <span id={valueId} className="truncate">
          {selected?.label}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-nocturne-ink-faint transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12, ease: "easeIn" } }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top center" }}
            className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 min-w-48 overflow-auto rounded-nocturne-control border border-nocturne-border bg-nocturne-card p-1.5 shadow-nocturne-menu"
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  id={optionId(index)}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  // Keep focus on the trigger so aria-activedescendant stays valid.
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => commit(index)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-[0.5rem] px-3 py-2 text-sm transition-colors duration-100",
                    isActive ? "bg-nocturne-accent-tint text-nocturne-ink" : "text-nocturne-ink-muted",
                    isSelected && "font-medium text-nocturne-ink",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check aria-hidden className="size-4 shrink-0 text-nocturne-accent-text" />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
