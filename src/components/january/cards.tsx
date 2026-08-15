import { motion } from "framer-motion";
import { LayoutGrid, List, Search, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Toolbar: search + selects + view toggle. */
export function Toolbar({
  placeholder = "Search...",
  selects = [],
  view,
  onView,
}: {
  placeholder?: string;
  selects?: string[][];
  view?: "grid" | "list";
  onView?: (v: "grid" | "list") => void;
}) {
  return (
    <div className="glass-tile mb-3 flex flex-wrap items-center gap-2 p-2">
      <div className="relative min-w-[160px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder={placeholder}
          className="h-8 w-full rounded-md border border-hairline bg-secondary/40 pr-2 pl-8 text-[11.5px] outline-none focus:border-amber/40"
        />
      </div>
      {selects.map((opts, i) => (
        <select
          key={i}
          className="h-8 rounded-md border border-hairline bg-secondary/40 px-2 text-[11.5px] text-foreground/85 outline-none focus:border-amber/40"
        >
          {opts.map((o) => (
            <option key={o} className="bg-card">
              {o}
            </option>
          ))}
        </select>
      ))}
      {onView ? (
        <div className="flex overflow-hidden rounded-md border border-hairline">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              aria-label={`${v} view`}
              className={cn(
                "grid size-8 place-items-center transition-colors",
                view === v ? "bg-accent/60 text-amber" : "text-muted-foreground hover:bg-accent/30",
              )}
            >
              {v === "grid" ? <LayoutGrid className="size-3.5" /> : <List className="size-3.5" />}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Filter tabs row. */
export function FilterTabs({ tabs }: { tabs: string[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {tabs.map((t, i) => (
        <button
          key={t}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-[11.5px] transition-colors",
            i === 0
              ? "border-amber/40 bg-accent/60 text-amber"
              : "border-hairline text-muted-foreground hover:bg-accent/30 hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

const HUES = ["55", "155", "235", "300", "25", "85"];

/** Abstract generated thumbnail (placeholder for real media). */
export function Thumb({
  icon: Icon,
  seed = 0,
  className,
  overlay,
}: {
  icon: LucideIcon;
  seed?: number;
  className?: string;
  overlay?: ReactNode;
}) {
  const hue = HUES[seed % HUES.length];
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border border-hairline", className)}
      style={{
        backgroundImage: `radial-gradient(circle at 30% 25%, oklch(0.55 0.16 ${hue} / 0.35), transparent 60%), radial-gradient(circle at 75% 80%, oklch(0.45 0.14 ${hue} / 0.28), transparent 55%), linear-gradient(160deg, oklch(0.2 0.01 60), oklch(0.13 0.005 60))`,
      }}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0.05 60 / 0.14) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.05 60 / 0.14) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <Icon
        className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 opacity-70"
        style={{ color: `oklch(0.8 0.15 ${hue})` }}
      />
      {overlay}
    </div>
  );
}

/** Generic media card used by Projects / 3D Lab / Simulations / Vision. */
export function MediaCard({
  icon,
  seed,
  status,
  statusTone = "amber",
  title,
  category,
  description,
  progress,
  meta,
}: {
  icon: LucideIcon;
  seed: number;
  status?: string;
  statusTone?: "amber" | "ok" | "info" | "danger" | "violet";
  title: string;
  category?: string;
  description?: string;
  progress?: number;
  meta?: string;
}) {
  const toneClass = {
    amber: "border-amber/40 text-amber",
    ok: "border-ok/40 text-ok",
    info: "border-info/40 text-info",
    danger: "border-danger/40 text-danger",
    violet: "border-violet/40 text-violet",
  }[statusTone];

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="glass-tile group flex flex-col overflow-hidden"
    >
      <Thumb
        icon={icon}
        seed={seed}
        className="aspect-[16/10] rounded-none border-0 border-b border-hairline"
        overlay={
          <>
            {status ? (
              <span
                className={cn(
                  "absolute top-2 left-2 rounded-md border bg-background/70 px-1.5 py-0.5 text-[9.5px] backdrop-blur",
                  toneClass,
                )}
              >
                {status}
              </span>
            ) : null}
            <Star className="absolute top-2 right-2 size-3.5 text-muted-foreground/70 transition-colors group-hover:text-amber" />
          </>
        }
      />
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 truncate text-[12.5px] font-medium text-foreground">{title}</h4>
          {category ? (
            <span className="shrink-0 rounded border border-hairline px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {category}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="line-clamp-2 text-[10.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {typeof progress === "number" ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground/85">{progress}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-secondary/70">
              <div className="amber-gradient h-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
        {meta ? <p className="text-[9.5px] text-muted-foreground/70">{meta}</p> : null}
      </div>
    </motion.article>
  );
}

/** Simple two-column definition list used across detail rails. */
export function KeyValueList({ rows }: { rows: [string, string][] }) {
  return (
    <ul className="space-y-1.5 text-[11px]">
      {rows.map(([k, v]) => (
        <li key={k} className="flex items-center justify-between gap-2">
          <span className="truncate text-muted-foreground">{k}</span>
          <span className="truncate text-foreground/85">{v}</span>
        </li>
      ))}
    </ul>
  );
}
