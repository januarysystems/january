import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ---------------- Panel ---------------- */

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-panel overflow-hidden", className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-hairline px-4 py-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? <Icon className="size-3.5 shrink-0 text-amber" /> : null}
        <h3 className="truncate font-display text-[11px] font-semibold tracking-[0.16em] text-foreground/85 uppercase">
          {title}
        </h3>
      </div>
      {action ? <div className="shrink-0 text-[11px] text-amber">{action}</div> : null}
    </div>
  );
}

/* ---------------- Status ---------------- */

const toneMap = {
  amber: "text-amber",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-info",
  violet: "text-violet",
  muted: "text-muted-foreground",
} as const;

export type Tone = keyof typeof toneMap;

export function StatusDot({ tone = "ok", pulse }: { tone?: Tone; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 rounded-full bg-current",
        toneMap[tone],
        pulse && "animate-pulse",
      )}
    />
  );
}

export function Chip({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-hairline bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium tracking-wide",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Stat card ---------------- */

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "amber",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="glass-tile flex items-center gap-3 px-3 py-3"
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg border border-hairline bg-secondary/50",
          toneMap[tone],
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="font-display text-lg leading-none font-semibold text-foreground">
          {value}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">{label}</div>
        {hint ? <div className="truncate text-[10px] text-muted-foreground/70">{hint}</div> : null}
      </div>
    </motion.div>
  );
}

/* ---------------- Metric bar ---------------- */

export function MetricBar({
  label,
  value,
  tone = "amber",
}: {
  label: string;
  value: number;
  tone?: Tone;
}) {
  const barTone =
    tone === "ok"
      ? "bg-ok"
      : tone === "info"
        ? "bg-info"
        : tone === "danger"
          ? "bg-danger"
          : "amber-gradient";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground/90">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary/70">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={cn("h-full rounded-full", barTone)}
        />
      </div>
    </div>
  );
}

/* ---------------- Donut ---------------- */

export type DonutSegment = { label: string; value: number; color: string };

export function Donut({
  segments,
  total,
  caption,
  size = 108,
}: {
  segments: DonutSegment[];
  total: string | number;
  caption?: string;
  size?: number;
}) {
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-secondary" />
          {segments.map((s) => {
            const len = (s.value / sum) * c;
            const el = (
              <motion.circle
                key={s.label}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                strokeWidth="9"
                strokeLinecap="round"
                stroke={s.color}
                strokeDasharray={`${len} ${c - len}`}
                initial={{ strokeDashoffset: -offset - len }}
                animate={{ strokeDashoffset: -offset }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-display text-xl leading-none font-bold text-foreground">
              {total}
            </div>
            {caption ? (
              <div className="text-[10px] text-muted-foreground">{caption}</div>
            ) : null}
          </div>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="ml-auto shrink-0 text-foreground/85">
              {s.value} ({Math.round((s.value / sum) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Quick actions ---------------- */

export function QuickActionGrid({
  actions,
  columns = 3,
}: {
  actions: { icon: LucideIcon; label: string }[];
  columns?: 2 | 3;
}) {
  return (
    <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {actions.map((a) => (
        <motion.button
          key={a.label}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="glass-tile flex flex-col items-center gap-1.5 px-2 py-3 text-center transition-colors hover:border-amber/40 hover:bg-accent/40"
        >
          <a.icon className="size-4 text-amber" />
          <span className="text-[10px] leading-tight text-muted-foreground">{a.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

/* ---------------- Activity list ---------------- */

export function ActivityRow({
  icon: Icon,
  tone = "amber",
  title,
  subtitle,
  time,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  subtitle?: string;
  time?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/30">
      <span
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-hairline bg-secondary/50",
          toneMap[tone],
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] text-foreground/90">{title}</p>
        {subtitle ? (
          <p className="truncate text-[10.5px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {time ? (
        <span className="shrink-0 text-[10px] whitespace-nowrap text-muted-foreground/70">
          {time}
        </span>
      ) : null}
    </div>
  );
}

/* ---------------- Sparkline ---------------- */

export function Sparkline({
  points,
  color = "var(--amber)",
  className,
}: {
  points: number[];
  color?: string;
  className?: string;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 30 - ((p - min) / (max - min || 1)) * 26 - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-10 w-full", className)}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}