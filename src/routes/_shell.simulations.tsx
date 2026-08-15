import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  CircuitBoard,
  FlaskConical,
  Gauge,
  Loader2,
  Plus,
  Thermometer,
  Trash2,
  Waves,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, KeyValueList, MediaCard, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
} from "@/components/january/primitives";
import { createSimulation, deleteSimulation, listSimulations, type Simulation, updateSimulation } from "@/lib/api";

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
        property: "og:description", content: "Simulation runs with solver settings, compute load and result previews." },
    ],
  }),
  component: SimulationsPage,
});

const CATEGORIES = ["physics", "thermal", "cfd", "circuit", "mechanical", "chemical", "iot", "robotics"];
const CATEGORY_LABEL: Record<string, string> = {
  physics: "Physics",
  thermal: "Thermal",
  cfd: "CFD",
  circuit: "Circuit",
  mechanical: "Mechanical",
  chemical: "Chemical",
  iot: "IoT",
  robotics: "Robotics",
};
const STATUSES = ["draft", "queued", "running", "completed", "failed"];
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

function SimulationsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    category: "physics",
    status: "draft",
  });

  const { data: simulations = [], isLoading } = useQuery({
    queryKey: ["simulations"],
    queryFn: listSimulations,
  });

  const create = useMutation({
    mutationFn: () => createSimulation(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      setIsCreating(false);
      setDraft({ name: "", description: "", category: "physics", status: "draft" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSimulation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["simulations"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Simulation> }) =>
      updateSimulation(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["simulations"] }),
  });

  const stats = useMemo(() => {
    const running = simulations.filter((s) => s.status === "running").length;
    const queued = simulations.filter((s) => s.status === "queued").length;
    return {
      total: simulations.length,
      running,
      queued,
      computeHours: "—",
    };
  }, [simulations]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    simulations.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return Object.entries(counts);
  }, [simulations]);

  const filteredSims = simulations.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell promptPlaceholder="Describe a simulation to set up..." rightPanel={<SimRail categoryCounts={categoryCounts} />}>
      <PageHeader
        title="Simulations"
        subtitle="Physics, thermal and circuit runs in one console"
        actions={
          <AmberButton onClick={() => setIsCreating(true)}>
            <Plus className="size-3.5" /> New Simulation
          </AmberButton>
        }
      />

      {isCreating ? (
        <Panel className="mb-3">
          <PanelHeader title="Create Simulation" />
          <form
            className="grid gap-3 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <input
              required
              placeholder="Simulation name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="h-10 rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-card">
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <input
              placeholder="Brief description"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50 sm:col-span-2"
            />
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
        <StatCard icon={FlaskConical} label="Total Runs" value={stats.total} hint="All time" />
        <StatCard icon={Zap} label="Running" value={stats.running} hint="Active now" tone="warn" />
        <StatCard icon={Activity} label="Queued" value={stats.queued} hint="Waiting" tone="info" />
        <StatCard icon={Gauge} label="Compute Hours" value={stats.computeHours} hint="Engine required" tone="violet" />
      </div>

      <Toolbar
        placeholder="Search simulations..."
        selects={[["All Types", "CFD", "FEA", "Thermal", "Circuit"], ["All Status", "Running", "Queued", "Completed"]]}
        onSearchChange={setSearchQuery}
      />
      <FilterTabs tabs={["All", "Running", "Queued", "Completed", "Failed"]} />

      {isLoading ? (
        <p className="text-[12px] text-muted-foreground">Loading simulations...</p>
      ) : filteredSims.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-[13px] font-medium text-foreground">No simulations yet</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Create a simulation to see runs and results here.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSims.map((sim, i) => (
            <div key={sim.id} className="relative group">
              <MediaCard
                icon={FlaskConical}
                seed={i}
                title={sim.name}
                category={CATEGORY_LABEL[sim.category]}
                description={sim.description ?? ""}
                meta={new Date(sim.updated_at).toLocaleDateString()}
                status={STATUS_LABEL[sim.status] ?? sim.status}
                statusTone={sim.status === "completed" ? "ok" : sim.status === "failed" ? "danger" : sim.status === "running" ? "warn" : "amber"}
              />
              <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100">
                {sim.status === "draft" && (
                  <button
                    onClick={() => update.mutate({ id: sim.id, data: { status: "queued" } })}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-ok"
                  >
                    <Zap className="size-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Delete "${sim.name}"?`)) {
                      remove.mutate(sim.id);
                    }
                  }}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function SimRail({ categoryCounts }: { categoryCounts: [string, number][] }) {
  return (
    <>
      <Panel>
        <PanelHeader title="Compute Load" action="Details" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No compute load data is available yet.</p>
          <p>Active simulations will show resource usage once the simulation engine is running.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Active Run" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No active simulation is running.</p>
          <p>Queue a simulation to view live run details in Phase 2.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Categories" />
        <ul className="space-y-1.5 p-3 text-[11px]">
          {categoryCounts.length === 0 ? (
            <li className="text-muted-foreground">No categories yet</li>
          ) : (
            categoryCounts.map(([cat, count]) => (
              <li key={cat} className="flex items-center justify-between">
                <span className="text-muted-foreground">{CATEGORY_LABEL[cat] || cat}</span>
                <span className="text-foreground/85">{count}</span>
              </li>
            ))
          )}
        </ul>
      </Panel>
    </>
  );
}
