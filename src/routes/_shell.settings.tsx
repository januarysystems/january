import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Cpu,
  Globe,
  KeyRound,
  Mic,
  Monitor,
  Palette,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { KeyValueList } from "@/components/january/cards";
import { Chip, MetricBar, Panel, PanelHeader } from "@/components/january/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings — configure JANUARY" },
      {
        name: "description",
        content:
          "Tune JANUARY's appearance, assistant behaviour, voice, privacy and connected API keys.",
      },
      { property: "og:title", content: "Settings — JANUARY" },
      {
        property: "og:description",
        content: "Appearance, assistant, voice, notifications, privacy and integration settings.",
      },
    ],
  }),
  component: SettingsPage,
});

const SECTIONS = [
  { id: "general", label: "General", icon: Monitor },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "assistant", label: "Assistant", icon: Sparkles },
  { id: "voice", label: "Voice & Speech", icon: Mic },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
  { id: "api", label: "API Keys", icon: KeyRound },
  { id: "account", label: "Account", icon: User },
];

function Toggle({ label, hint, on = true }: { label: string; hint?: string; on?: boolean }) {
  const [checked, setChecked] = useState(on);
  return (
    <button
      onClick={() => setChecked((c) => !c)}
      className="flex w-full items-center gap-3 rounded-lg border border-hairline bg-secondary/30 px-3 py-2.5 text-left hover:border-amber/30"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] text-foreground">{label}</span>
        {hint ? (
          <span className="block truncate text-[10px] text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors",
          checked
            ? "justify-end border-amber/50 bg-accent/60"
            : "justify-start border-hairline bg-secondary/60",
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-full",
            checked ? "amber-gradient" : "bg-muted-foreground/50",
          )}
        />
      </span>
    </button>
  );
}

function Field({ label, value, options }: { label: string; value: string; options?: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      {options ? (
        <select className="h-9 w-full rounded-lg border border-hairline bg-secondary/40 px-2.5 text-[12px] text-foreground outline-none focus:border-amber/40">
          {options.map((o) => (
            <option key={o} className="bg-card">
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          defaultValue={value}
          className="h-9 w-full rounded-lg border border-hairline bg-secondary/40 px-2.5 text-[12px] text-foreground outline-none focus:border-amber/40"
        />
      )}
    </label>
  );
}

function SettingsPage() {
  const [active, setActive] = useState("general");

  return (
    <AppShell promptPlaceholder="Ask January to change a setting..." rightPanel={<SettingsRail />}>
      <PageHeader
        title="Settings"
        subtitle="Configure how January looks, thinks and responds"
        actions={
          <>
            <GhostButton>Reset</GhostButton>
            <AmberButton>Save Changes</AmberButton>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row">
        <Panel className="lg:w-[200px] lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] transition-colors",
                  active === s.id
                    ? "border border-amber/35 bg-accent/50 text-amber"
                    : "border border-transparent text-muted-foreground hover:bg-accent/30 hover:text-foreground",
                )}
              >
                <s.icon className="size-3.5" />
                {s.label}
              </button>
            ))}
          </nav>
        </Panel>

        <div className="min-w-0 flex-1 space-y-3">
          <Panel>
            <PanelHeader title="General" icon={Monitor} />
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              <Field label="Display Name" value="Ashwin" />
              <Field
                label="Language"
                value="English"
                options={["English", "Tamil", "Hindi", "German"]}
              />
              <Field
                label="Timezone"
                value="GMT+5:30"
                options={["GMT+5:30", "UTC", "GMT+1", "GMT-5"]}
              />
              <Field label="Startup Page" value="Home" options={["Home", "Chat", "Projects"]} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Appearance" icon={Palette} />
            <div className="space-y-2 p-3">
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="amber">Liquid Glass (Dark)</Chip>
                <Chip>Midnight</Chip>
                <Chip>Carbon</Chip>
              </div>
              <Toggle label="Glass blur effects" hint="Translucent panels and depth" />
              <Toggle label="Motion & animations" hint="Smooth transitions across the app" />
              <Toggle label="Compact density" hint="Reduce padding across panels" on={false} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Assistant" icon={Sparkles} />
            <div className="space-y-2 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Default Model" value="None" options={["None"]} />
                <Field
                  label="Response Style"
                  value="Technical"
                  options={["Technical", "Concise", "Friendly"]}
                />
              </div>
              <Toggle label="Long-term memory" hint="Remember facts across sessions" />
              <Toggle label="Web search" hint="Allow January to browse for fresh data" />
              <Toggle label="Auto-cite documents" hint="Reference source files in answers" />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Voice & Notifications" icon={Mic} />
            <div className="space-y-2 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Voice"
                  value="January (Neutral)"
                  options={["January (Neutral)", "Warm", "Crisp"]}
                />
                <Field label="Wake Word" value="Hey January" />
              </div>
              <Toggle label="Voice replies" hint="Speak responses out loud" />
              <Toggle label="Desktop notifications" hint="Alerts for automations and devices" />
              <Toggle label="Sound effects" hint="Subtle interface feedback" on={false} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Privacy & Security" icon={Shield} />
            <div className="space-y-2 p-3">
              <Toggle label="Two-factor authentication" hint="Extra layer of account security" />
              <Toggle
                label="Local-only processing"
                hint="Keep sensitive data on device"
                on={false}
              />
              <Toggle label="Usage analytics" hint="Help improve January" on={false} />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="System" icon={Cpu} />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>System metrics are not available in cleanup mode.</p>
          <p>Live CPU, memory and storage data will appear here once connected.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Build Info" icon={Globe} />
        <div className="p-3">
          <KeyValueList
            rows={[
              ["Version", "—"],
              ["Channel", "—"],
              ["Runtime", "—"],
              ["Region", "—"],
              ["Last Sync", "—"],
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Connected Keys" icon={KeyRound} action="Manage" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No API keys are connected.</p>
          <p>Connect keys to enable third-party models and services.</p>
        </div>
      </Panel>
    </>
  );
}
