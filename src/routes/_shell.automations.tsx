import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Cloud,
  Mail,
  PlayCircle,
  Plus,
  Repeat,
  Workflow,
  Zap,
} from "lucide-react";

import { AmberButton, AppShell, PageHeader } from "@/components/january/AppShell";
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
        property: "og:description",
        content: "Scheduled and event-driven workflows with run history and success rates.",
      },
    ],
  }),
  component: AutomationsPage,
});


function AutomationsPage() {
  return (
    <AppShell promptPlaceholder="Describe an automation to create..." rightPanel={<AutomationsRail />}>
      <PageHeader
        title="Automations"
        subtitle="Let January run your recurring work"
        actions={
          <AmberButton>
            <Plus className="size-3.5" /> New Automation
          </AmberButton>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Workflow} label="Total Flows" value={0} hint="Configured" />
        <StatCard icon={PlayCircle} label="Running" value={0} hint="Currently enabled" tone="ok" />
        <StatCard icon={CheckCircle2} label="Runs Today" value={0} hint="Executions" tone="info" />
        <StatCard icon={Zap} label="Success Rate" value="—" hint="Last 30 days" tone="violet" />
      </div>

      <Toolbar
        placeholder="Search automations..."
        selects={[["All Triggers", "Schedule", "Event", "Manual"], ["All Status", "Enabled", "Paused"]]}
      />
      <FilterTabs tabs={["All", "Enabled", "Paused", "Scheduled", "Event Based"]} />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No automations configured</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Create an automation to begin scheduling workflows and events.
        </p>
      </Panel>
    </AppShell>
  );
}

function AutomationsRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Engine Health" action="Logs" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No automation engine health data is available yet.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recent Runs" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No automation runs have been executed yet.</p>
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