import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Cloud,
  Loader2,
  Mail,
  Pause,
  Play,
  Plus,
  Repeat,
  Trash2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  Chip,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
  StatusDot,
} from "@/components/january/primitives";
import { createAutomation, deleteAutomation, listAutomations, type Automation, updateAutomation } from "@/lib/api";

export const Route = createFileRoute("/_shell/automations")({
  head: () => ({
    meta: [
      { title: "Automations — JANUARY workflow engine" },
      {
        name: "description",
        content:
          "Create trigger-based workflows that let JANUARY run reports, alerts and device routines on its own.",
      },
      { property: "og:title", content: "Automations — JANUARY" },
      {
        property: "og:description", content: "Scheduled and event-driven workflows with run history and success rates." },
    ],
  }),
  component: AutomationsPage,
});

const TRIGGERS = ["manual", "schedule", "event", "webhook", "device"];
const TRIGGER_LABEL: Record<string, string> = {
  manual: "Manual",
  schedule: "Schedule",
  event: "Event",
  webhook: "Webhook",
  device: "Device",
};
const STATUSES = ["paused", "enabled", "disabled", "error"];

function AutomationsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    trigger_type: "manual",
    schedule: "",
    status: "paused",
  });

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: listAutomations,
  });

  const create = useMutation({
    mutationFn: () => createAutomation(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      setIsCreating(false);
      setDraft({ name: "", description: "", trigger_type: "manual", schedule: "", status: "paused" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAutomation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAutomation(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });

  const stats = useMemo(() => {
    const enabled = automations.filter((a) => a.status === "enabled").length;
    return {
      total: automations.length,
      running: enabled,
      runsToday: 0,
      successRate: "—",
    };
  }, [automations]);

  const filteredAutomations = automations.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell promptPlaceholder="Describe an automation to create..." rightPanel={<AutomationsRail />}>
      <PageHeader
        title="Automations"
        subtitle="Let January run your recurring work"
        actions={
          <AmberButton onClick={() => setIsCreating(true)}>
            <Plus className="size-3.5" /> New Automation
          </AmberButton>
        }
      />

      {isCreating ? (
        <Panel className="mb-3">
          <PanelHeader title="Create Automation" />
          <form
            className="grid gap-3 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <input
              required
              placeholder="Automation name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <input
              placeholder="Brief description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <select
              value={draft.trigger_type}
              onChange={(e) => setDraft({ ...draft, trigger_type: e.target.value })}
              className="h-10 rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            >
              {TRIGGERS.map((t) => (
                <option key={t} value={t} className="bg-card">
                  {TRIGGER_LABEL[t]}
                </option>
              ))}
            </select>
            {draft.trigger_type === "schedule" ? (
              <input
                placeholder="Cron schedule (e.g., 0 9 * *)"
                value={draft.schedule}
                onChange={(e) => setDraft({ ...draft, schedule: e.target.value })}
                className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
              />
            ) : (
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                className="h-10 rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-card">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <AmberButton type="submit" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Create
              </AmberButton>
              <GhostButton type="button" onClick={() => setIsCreating(false)}>
                <X className="size-3.5" /> Cancel
              </GhostButton>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Workflow} label="Total Flows" value={stats.total} hint="Configured" />
        <StatCard icon={Play} label="Running" value={stats.running} hint="Currently enabled" tone="ok" />
        <StatCard icon={CheckCircle2} label="Runs Today" value={stats.runsToday} hint="Executions" tone="info" />
        <StatCard icon={Zap} label="Success Rate" value={stats.successRate} hint="Engine not active" tone="violet" />
      </div>

      <Toolbar
        placeholder="Search automations..."
        selects={[["All Triggers", "Schedule", "Event", "Manual"], ["All Status", "Enabled", "Paused"]]}
        onSearchChange={setSearchQuery}
      />
      <FilterTabs tabs={["All", "Enabled", "Paused", "Scheduled", "Event Based"]} />

      {isLoading ? (
        <p className="text-[12px] text-muted-foreground">Loading automations...</p>
      ) : filteredAutomations.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-[13px] font-medium text-foreground">No automations configured</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Create an automation to begin scheduling workflows and events.
          </p>
        </Panel>
      ) : (
        <Panel>
          <div className="divide-y divide-[var(--hairline)]">
            {filteredAutomations.map((automation) => (
              <div key={automation.id} className="group px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-medium text-foreground">
                        {automation.name}
                      </span>
                      <Chip>{TRIGGER_LABEL[automation.trigger_type]}</Chip>
                      <Chip tone={automation.status === "enabled" ? "ok" : "amber"}>
                        <StatusDot tone={automation.status === "enabled" ? "ok" : "amber"} />
                        {automation.status}
                      </Chip>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {automation.description || "No description"} {automation.schedule ? `• ${automation.schedule}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    {automation.status === "paused" || automation.status === "disabled" ? (
                      <button
                        onClick={() => toggleStatus.mutate({ id: automation.id, status: "enabled" })}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-ok"
                      >
                        <Play className="size-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleStatus.mutate({ id: automation.id, status: "paused" })}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                      >
                        <Pause className="size-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${automation.name}"?`)) {
                          remove.mutate(automation.id);
                        }
                      }}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </AppShell>
  );
}

function AutomationsRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Engine Health" action="Logs" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Automation engine will run in Phase 2.</p>
          <p>Configure automations now — they will execute once the engine is connected.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recent Runs" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No automation runs have been executed yet.</p>
          <p>Run history will appear here once the automation engine is active.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Templates" />
        <div className="space-y-1.5 p-3">
          {["Morning Briefing", "Device Watchdog", "Weekly Report", "Data Sync"].map((t) => (
            <button
              key={t}
              className="flex w-full items-center gap-2 rounded-lg border border-hairline bg-secondary/40 px-2.5 py-2 text-left text-[11.5px] text-foreground/85 hover:border-amber/40 hover:text-amber"
            >
              <Plus className="size-3.5" /> {t}
            </button>
          ))}
        </div>
      </Panel>
    </>
  );
}
