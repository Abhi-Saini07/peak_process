/** The Peak mark: periwinkle peaks on a deep navy tile (same in light and dark). */
export function PeakMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-nocturne-forest-raised" />
      <path d="M7 22.5L13.5 10L17 16.2L19.8 11.6L25 22.5H7Z" className="fill-[#8fa2ff]" />
    </svg>
  );
}
