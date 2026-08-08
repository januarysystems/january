import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Boxes,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  UserCog,
} from "lucide-react";

import { JanuaryLogo } from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutUser } from "@/hooks/useAuth";
import { getProfile, listNotifications, markNotificationRead } from "@/lib/api";

export function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
  });
  const unread = notifications.filter((n) => !n.is_read).length;

  const name = profile?.full_name?.trim() || profile?.email?.split("@")[0] || "January user";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOutUser();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="glass-panel flex items-center gap-3 rounded-2xl px-3 py-2.5">
      <Link to="/dashboard" className="shrink-0">
        <JanuaryLogo />
      </Link>

      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="glass-tile grid size-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-amber"
      >
        <Menu className="size-4" />
      </button>

      <div className="relative hidden min-w-0 flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search anything or ask January..."
          className="h-9 w-full rounded-full border border-hairline bg-secondary/40 pr-16 pl-9 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-amber/45 focus:ring-2 focus:ring-ring/40"
        />
        <kbd className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-muted-foreground/70">
          Ctrl + K
        </kbd>
      </div>
      <div className="flex-1 md:hidden" />

      <div className="flex shrink-0 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Notifications"
            className="glass-tile relative grid size-9 place-items-center text-muted-foreground outline-none transition-colors hover:text-amber"
          >
            <Bell className="size-4" />
            {unread > 0 ? (
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-amber" />
            ) : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs">
              Notifications
              <span className="block text-[10px] font-normal text-muted-foreground">
                {unread} unread
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <p className="px-2 py-3 text-[11px] text-muted-foreground">Nothing new yet.</p>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex-col items-start gap-0.5"
                  onSelect={async () => {
                    await markNotificationRead(n.id);
                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                  }}
                >
                  <span className="text-[11.5px] text-foreground">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">{n.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          to="/projects"
          aria-label="Workspace"
          className="glass-tile hidden size-9 place-items-center text-muted-foreground transition-colors hover:text-amber sm:grid"
        >
          <Boxes className="size-4" />
        </Link>
        <Link
          to="/settings"
          aria-label="Settings"
          className="glass-tile hidden size-9 place-items-center text-muted-foreground transition-colors hover:text-amber sm:grid"
        >
          <Settings className="size-4" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="glass-tile flex items-center gap-2 py-1.5 pr-2 pl-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid size-7 place-items-center overflow-hidden rounded-full border border-amber/40 bg-secondary/60 text-amber">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                <User className="size-3.5" />
              )}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[11.5px] text-foreground">{name}</span>
              <span className="block text-[9.5px] text-amber">Pro Plan</span>
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">
              {name}
              <span className="block text-[10px] font-normal text-muted-foreground">
                {profile?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
              <User className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/profile" })}>
              <UserCog className="size-4" /> Manage Account
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger focus:text-danger" onSelect={handleSignOut}>
              <LogOut className="size-4" /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
