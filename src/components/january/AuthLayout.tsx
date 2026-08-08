import { motion } from "framer-motion";
import { Activity, Cpu, Radio, Workflow } from "lucide-react";
import type { ReactNode } from "react";

import authCore from "@/assets/auth-core.jpg";

const FEATURES = [
  { icon: Workflow, label: "Intelligent\nAutomation" },
  { icon: Activity, label: "Real-time\nMonitoring" },
  { icon: Cpu, label: "Advanced\nSimulations" },
  { icon: Radio, label: "Seamless\nIntegration" },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid-backdrop min-h-screen bg-background p-3 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl items-center gap-6 lg:grid-cols-2">
        {/* Brand side */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6 px-2 text-center"
        >
          <div className="space-y-3">
            <svg viewBox="0 0 24 24" className="mx-auto size-14" aria-hidden>
              <path
                d="M3 4h18L12 21 3 4Z"
                fill="none"
                stroke="var(--amber)"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path d="M8.5 8.5h7L12 15.5 8.5 8.5Z" fill="var(--amber)" opacity="0.9" />
            </svg>
            <h1 className="font-display text-3xl font-bold tracking-[0.42em] text-foreground sm:text-4xl">
              JANUARY
            </h1>
            <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
              Your <span className="text-amber">Intelligent</span> Assistant
            </p>
            <p className="text-sm text-foreground/80">One platform. Infinite possibilities.</p>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
              Manage, automate and simulate your ideas with the power of AI, IoT &amp; Robotics.
            </p>
          </div>

          <img
            src={authCore}
            alt="January holographic AI core illustration"
            width={1024}
            height={1024}
            className="w-full max-w-md drop-shadow-[0_0_60px_oklch(0.7_0.18_55/0.25)]"
          />

          <ul className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center justify-center gap-2">
                <f.icon className="size-4 shrink-0 text-amber" />
                <span className="text-left text-[10px] leading-tight whitespace-pre-line text-muted-foreground">
                  {f.label}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex w-full max-w-lg items-center justify-between text-[10px] text-muted-foreground/70">
            <span>© 2026 January Platform. All rights reserved.</span>
            <span className="text-amber">v2.0.0</span>
          </div>
        </motion.section>

        {/* Form side */}
        <motion.section
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel mx-auto w-full max-w-md p-6 sm:p-8"
        >
          {children}
        </motion.section>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  icon: Icon,
  trailing,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  trailing?: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11.5px] font-medium text-foreground/85">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-amber/80" />
        <input
          className="h-11 w-full rounded-lg border border-hairline bg-secondary/40 pr-10 pl-9 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-amber/50 focus:ring-2 focus:ring-ring/40"
          {...rest}
        />
        {trailing ? (
          <span className="absolute top-1/2 right-3 -translate-y-1/2">{trailing}</span>
        ) : null}
      </span>
    </label>
  );
}