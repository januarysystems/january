import { cn } from "@/lib/utils";

export function JanuaryMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-xl border border-amber/40 bg-secondary/40",
        className,
      )}
    >
      <span className="absolute inset-0 rounded-xl bg-amber/10 blur-[6px]" aria-hidden />
      <svg viewBox="0 0 24 24" className="relative size-5" aria-hidden>
        <path
          d="M3 4h18L12 21 3 4Z"
          fill="none"
          stroke="var(--amber)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M8.5 8.5h7L12 15.5 8.5 8.5Z" fill="var(--amber)" opacity="0.85" />
      </svg>
    </span>
  );
}

export function JanuaryLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <JanuaryMark />
      {!compact && (
        <div className="min-w-0 leading-none">
          <div className="font-display text-[15px] font-bold tracking-[0.34em] text-foreground">
            JANUARY
          </div>
          <div className="mt-1 truncate text-[7.5px] tracking-[0.24em] text-amber/80 uppercase">
            Your Intelligent Assistant
          </div>
        </div>
      )}
    </div>
  );
}