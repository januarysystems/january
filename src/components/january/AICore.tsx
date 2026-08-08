import { motion } from "framer-motion";
import { useState } from "react";

import { CORE_STATES, JanuaryCore, type CoreState } from "./JanuaryCore";
import { cn } from "@/lib/utils";

const ORDER: CoreState[] = ["idle", "listening", "thinking", "speaking", "success", "error"];

/**
 * AI Core container — React Three Fiber GLTF core with six live states.
 */
export function AICore({
  state,
  onStateChange,
  showControls = true,
}: {
  state?: CoreState;
  onStateChange?: (s: CoreState) => void;
  showControls?: boolean;
}) {
  const [internal, setInternal] = useState<CoreState>("idle");
  const active = state ?? internal;
  const cfg = CORE_STATES[active];

  const setState = (s: CoreState) => {
    setInternal(s);
    onStateChange?.(s);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
      <div className="pointer-events-none absolute inset-x-6 top-1/2 -z-10 h-64 -translate-y-1/2 rounded-full bg-amber/12 blur-[90px]" />

      <div className="text-center">
        <h2 className="font-display text-lg font-bold tracking-[0.5em] text-foreground sm:text-2xl">
          JANUARY
        </h2>
        <p className="mt-1 text-[9px] tracking-[0.32em] text-muted-foreground uppercase">
          Your Intelligent Assistant
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative mt-2 aspect-square w-full max-w-[min(58vh,560px)] overflow-hidden rounded-3xl border border-hairline"
      >
        <JanuaryCore state={active} />
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-amber/15" />
      </motion.div>

      <div className="mt-2 flex items-center gap-3">
        <Waveform />
        <span className="shrink-0 text-[11px]" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        <Waveform reverse />
      </div>

      {showControls ? (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-[10px] capitalize transition-colors",
                active === s
                  ? "border-amber/45 bg-accent/60 text-amber"
                  : "border-hairline text-muted-foreground hover:bg-accent/30 hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Waveform({
  reverse = false,
  bars = 26,
  className = "",
}: {
  reverse?: boolean;
  bars?: number;
  className?: string;
}) {
  return (
    <div className={`flex h-6 items-center gap-[2px] ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded-full bg-amber/70"
          animate={{ height: ["20%", `${30 + ((i * 37) % 70)}%`, "20%"] }}
          transition={{
            duration: 1.1 + ((i % 5) * 0.12),
            repeat: Infinity,
            ease: "easeInOut",
            delay: (reverse ? bars - i : i) * 0.04,
          }}
        />
      ))}
    </div>
  );
}
