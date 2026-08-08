import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

import { NAV_ITEMS } from "./nav";
import { Sparkline } from "./primitives";
import { cn } from "@/lib/utils";

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "border border-amber/35 bg-accent/60 text-amber"
                  : "border border-transparent text-muted-foreground hover:bg-accent/35 hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-amber"
                />
              )}
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && <CoreStatusCard />}
    </div>
  );
}

function CoreStatusCard() {
  return (
    <div className="glass-tile shrink-0 space-y-2 p-3">
      <div className="flex items-center gap-2">
        <span className="size-1.5 animate-pulse rounded-full bg-ok" />
        <span className="font-display text-[10.5px] font-semibold tracking-[0.14em] text-amber uppercase">
          January Core
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">Online</p>
      <Sparkline points={[4, 12, 6, 18, 9, 22, 7, 16, 5, 14, 8, 20, 6]} />
      <ul className="space-y-1 text-[10px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-ok" /> System Status
        </li>
        <li className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-ok" /> All Systems Operational
        </li>
      </ul>
      <button className="flex w-full items-center justify-center gap-1.5 rounded-md border border-hairline bg-secondary/50 py-1.5 text-[10.5px] text-foreground/80 transition-colors hover:border-amber/40 hover:text-amber">
        <Activity className="size-3" /> Check Systems
      </button>
    </div>
  );
}