import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { SidebarNav } from "./AppSidebar";
import { PromptBar } from "./PromptBar";
import { TopBar } from "./TopBar";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  rightPanel,
  promptPlaceholder,
  footer,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
  promptPlaceholder?: string;
  footer?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="grid-backdrop min-h-screen bg-background p-2 sm:p-3">
      <div className="mx-auto flex h-[calc(100vh-1rem)] max-w-[1800px] flex-col gap-3 sm:h-[calc(100vh-1.5rem)]">
        <TopBar
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) setMobileOpen((v) => !v);
            else setCollapsed((v) => !v);
          }}
        />

        <div className="flex min-h-0 flex-1 gap-3">
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "glass-panel hidden shrink-0 p-2.5 transition-[width] duration-300 lg:block",
              collapsed ? "w-[68px]" : "w-[196px]",
            )}
          >
            <SidebarNav collapsed={collapsed} />
          </aside>

          {/* Mobile sidebar */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm lg:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: "spring", stiffness: 320, damping: 34 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-panel h-full w-[230px] rounded-none rounded-r-2xl p-3"
                >
                  <div className="mb-2 flex justify-end">
                    <button
                      aria-label="Close menu"
                      onClick={() => setMobileOpen(false)}
                      className="grid size-8 place-items-center rounded-md text-muted-foreground hover:text-amber"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="h-[calc(100%-2.5rem)]">
                    <SidebarNav onNavigate={() => setMobileOpen(false)} />
                  </div>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <motion.main
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="min-h-0 flex-1 overflow-y-auto pr-0.5"
            >
              {children}
            </motion.main>
            {footer}
            <PromptBar placeholder={promptPlaceholder ?? "Ask January anything..."} />
          </div>

          {/* Right panel */}
          {rightPanel ? (
            <aside className="hidden w-[288px] shrink-0 space-y-3 overflow-y-auto pr-0.5 xl:block">
              {rightPanel}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="min-w-0">
        <h1 className="truncate font-display text-xl font-bold tracking-[0.12em] text-foreground uppercase sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-[11.5px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AmberButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "amber-gradient glow-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "glass-tile inline-flex items-center gap-1.5 px-3 py-2 text-[12px] text-foreground/85 transition-colors hover:border-amber/40 hover:text-amber",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
