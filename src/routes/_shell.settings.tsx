import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Globe,
  Loader2,
  Mic,
  Palette,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { KeyValueList } from "@/components/january/cards";
import { Panel, PanelHeader } from "@/components/january/primitives";
import { cn } from "@/lib/utils";
import { getSettings, updateSettings } from "@/lib/api";

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
        property: "og:description", content: "Appearance, assistant, voice, notifications, privacy and integration settings." },
    ],
  }),
  component: SettingsPage,
});

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "assistant", label: "Assistant", icon: Sparkles },
  { id: "voice", label: "Voice", icon: Mic },
];

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
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
          value
            ? "justify-end border-amber/50 bg-accent/60"
            : "justify-start border-hairline bg-secondary/60",
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-full",
            value ? "amber-gradient" : "bg-muted-foreground/50",
          )}
        />
      </span>
    </button>
  );
}

function Field({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options?: string[];
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-9 w-full rounded-lg border border-hairline bg-secondary/40 px-2.5 text-[12px] text-foreground outline-none focus:border-amber/40"
        >
          {options.map((o) => (
            <option key={o} className="bg-card">
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="h-9 w-full rounded-lg border border-hairline bg-secondary/40 px-2.5 text-[12px] text-foreground outline-none focus:border-amber/40"
        />
      )}
    </label>
  );
}

function SettingsPage() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState("appearance");
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const [localSettings, setLocalSettings] = useState({
    theme: "dark",
    language: "en",
    voice_enabled: true,
    notifications_enabled: true,
  });

  const save = useMutation({
    mutationFn: () => updateSettings(localSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        theme: settings.theme || "dark",
        language: settings.language || "en",
        voice_enabled: settings.voice_enabled ?? true,
        notifications_enabled: settings.notifications_enabled ?? true,
      });
    }
  }, [settings]);

  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        theme: settings.theme || "dark",
        language: settings.language || "en",
        voice_enabled: settings.voice_enabled ?? true,
        notifications_enabled: settings.notifications_enabled ?? true,
      });
    }
  };

  return (
    <AppShell promptPlaceholder="Ask January to change a setting..." rightPanel={<SettingsRail />}>
      <PageHeader
        title="Settings"
        subtitle="Configure how January looks, thinks and responds"
        actions={
          <>
            <GhostButton onClick={handleReset}>Reset</GhostButton>
            <AmberButton onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Save Changes
            </AmberButton>
            {saved ? (
              <span className="flex items-center gap-1 text-[11px] text-ok">
                <Check className="size-3.5" /> Saved
              </span>
            ) : null}
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
          {active === "appearance" && (
            <Panel>
              <PanelHeader title="Appearance" icon={Palette} />
              <div className="space-y-2 p-3">
                <Field
                  label="Theme"
                  value={localSettings.theme}
                  options={["dark", "light", "system"]}
                  onChange={(v) => setLocalSettings({ ...localSettings, theme: v })}
                />
                <div className="mt-2 rounded-lg bg-muted/10 border border-hairline p-3">
                  <p className="text-[11px] text-muted-foreground">
                    Choose how JANUARY looks. Changes apply immediately after saving.
                  </p>
                </div>
              </div>
            </Panel>
          )}

          {active === "assistant" && (
            <Panel>
              <PanelHeader title="Assistant" icon={Sparkles} />
              <div className="space-y-2 p-3">
                <div className="rounded-lg bg-amber/10 border border-amber/30 p-4 text-center">
                  <Sparkles className="mx-auto mb-2 size-8 text-amber" />
                  <p className="text-[12px] font-medium text-foreground">JANUARY AI Assistant</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Powered by Puter AI (GPT-5.4-nano) - No API key required
                  </p>
                  <div className="mt-3 text-[10px] text-muted-foreground">
                    Configure models in <span className="text-amber">Settings → AI Models</span>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {active === "voice" && (
            <Panel>
              <PanelHeader title="Voice & Notifications" icon={Mic} />
              <div className="space-y-2 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Voice Gender" value="Female (Default)" options={["Female (Default)", "Male", "Neutral"]} />
                  <Field label="Language" value={localSettings.language === "en" ? "English" : localSettings.language.charAt(0).toUpperCase() + localSettings.language.slice(1)} options={["English", "Tamil", "Hindi", "German", "Spanish", "French"]} />
                </div>
                <Toggle
                  label="Voice replies"
                  hint="JANUARY speaks responses out loud with female voice"
                  value={localSettings.voice_enabled}
                  onChange={(v) => setLocalSettings({ ...localSettings, voice_enabled: v })}
                />
                <Toggle
                  label="Desktop notifications"
                  hint="Alerts for automations and devices"
                  value={localSettings.notifications_enabled}
                  onChange={(v) => setLocalSettings({ ...localSettings, notifications_enabled: v })}
                />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SettingsRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="AI Status" icon={Sparkles} />
        <div className="space-y-2 p-3 text-[11px] text-muted-foreground">
          <p className="text-amber">Puter AI: Ready</p>
          <p>Model: GPT-5.4-nano</p>
          <p className="text-[10px] mt-1">Powered by puter.com</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Build Info" icon={Globe} />
        <div className="p-3">
          <KeyValueList
            rows={[
              ["Version", "1.0.0"],
              ["Channel", "stable"],
              ["Runtime", "browser"],
              ["Last Sync", new Date().toLocaleDateString()],
            ]}
          />
        </div>
      </Panel>
    </>
  );
}
