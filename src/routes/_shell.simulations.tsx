import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CircuitBoard,
  FlaskConical,
  Gauge,
  Play,
  Plus,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

import { AmberButton, AppShell, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, KeyValueList, MediaCard, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
} from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/simulations")({
  head: () => ({
    meta: [
      { title: "Simulations — JANUARY physics & CFD lab" },
      {
        name: "description",
        content:
          "Queue, run and review CFD, thermal, structural and circuit simulations from one console.",
      },
      { property: "og:title", content: "Simulations — JANUARY" },
      {
        property: "og:description",
        content: "Simulation runs with solver settings, compute load and result previews.",
      },
    ],
  }),
  component: SimulationsPage,
});


function SimulationsPage() {
  return (
    <AppShell promptPlaceholder="Describe a simulation to set up..." rightPanel={<SimRail />}>
      <PageHeader
        title="Simulations"
        subtitle="Physics, thermal and circuit runs in one console"
        actions={
          <AmberButton>
            <Plus className="size-3.5" /> New Simulation
          </AmberButton>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={FlaskConical} label="Total Runs" value={0} hint="All time" />
        <StatCard icon={Play} label="Running" value={0} hint="Active now" tone="warn" />
        <StatCard icon={Zap} label="Queued" value={0} hint="Waiting" tone="info" />
        <StatCard icon={Gauge} label="Compute Hours" value="—" hint="This month" tone="violet" />
      </div>

      <Toolbar
        placeholder="Search simulations..."
        selects={[["All Types", "CFD", "FEA", "Thermal", "Circuit"], ["All Status", "Running", "Queued", "Completed"]]}
      />
      <FilterTabs tabs={["All", "Running", "Queued", "Completed", "Failed"]} />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No simulations yet</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Create a simulation to see runs and results here.
        </p>
      </Panel>
    </AppShell>
  );
}

function SimRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Compute Load" action="Details" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No compute load data is available yet.</p>
          <p>Active simulations will show resource usage here.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Active Run" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No active simulation is running.</p>
          <p>Start a new simulation to view live run details.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recent Results" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No simulation results are available yet.</p>
          <p>Results will appear here when simulations complete.</p>
        </div>
      </Panel>
    </>
  );
}