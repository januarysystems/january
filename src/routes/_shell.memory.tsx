import { createFileRoute } from "@tanstack/react-router";
import {
  BrainCircuit,
  Clock,
  Database,
  Download,
  Lightbulb,
  Pin,
  Plus,
  Trash2,
  User,
} from "lucide-react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  Chip,
  Donut,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
} from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/memory")({
  head: () => ({
    meta: [
      { title: "Memory — what JANUARY remembers about you" },
      {
        name: "description",
        content:
          "Review, pin and prune the facts, preferences and project knowledge JANUARY keeps in long-term memory.",
      },
      { property: "og:title", content: "Memory — JANUARY" },
      {
        property: "og:description",
        content: "Long-term memory store: personal facts, preferences, project context and skills.",
      },
    ],
  }),
  component: MemoryPage,
});

function MemoryPage() {
  return (
    <AppShell promptPlaceholder="Teach January something new..." rightPanel={<MemoryRail />}>
      <PageHeader
        title="Memory"
        subtitle="Everything January remembers about you and your work"
        actions={
          <>
            <GhostButton>
              <Download className="size-3.5" /> Export
            </GhostButton>
            <AmberButton>
              <Plus className="size-3.5" /> Add Memory
            </AmberButton>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Database} label="Total Memories" value={0} hint="Stored facts" />
        <StatCard icon={Pin} label="Pinned" value={0} hint="Always in context" tone="warn" />
        <StatCard
          icon={Lightbulb}
          label="Learned This Week"
          value={0}
          hint="New knowledge"
          tone="ok"
        />
        <StatCard
          icon={Database}
          label="Memory Used"
          value="0 GB"
          hint="of available storage"
          tone="info"
        />
      </div>

      <Toolbar
        placeholder="Search memories..."
        selects={[
          ["All Types", "Preference", "Skill", "Personal", "Project"],
          ["Newest", "Oldest"],
        ]}
      />
      <FilterTabs tabs={["All", "Pinned", "Preferences", "Skills", "Projects", "Personal"]} />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No memories yet</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          January will save facts, preferences and project details here once you add them.
        </p>
      </Panel>
    </AppShell>
  );
}

function MemoryRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Memory Breakdown" action="Details" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No memory breakdown is available yet.</p>
          <p>Memory categories and usage will appear after you add memory entries.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Storage" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Memory usage will be tracked once January has saved the first facts.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Profile Summary" icon={User} />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>
            Profile details will display here once you add personal preferences and project context.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recently Learned" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No learning history is available yet.</p>
        </div>
      </Panel>
    </>
  );
}
