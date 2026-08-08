import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Cpu,
  Download,
  Gauge,
  Layers,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";

import { AmberButton, AppShell, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, KeyValueList, Toolbar } from "@/components/january/cards";
import {
  Chip,
  Donut,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
  StatusDot,
} from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/ai-models")({
  head: () => ({
    meta: [
      { title: "AI Models — JANUARY model control room" },
      {
        name: "description",
        content:
          "Compare, activate and monitor the language, vision and speech models powering JANUARY.",
      },
      { property: "og:title", content: "AI Models — JANUARY" },
      {
        property: "og:description",
        content: "Model catalogue with latency, context window, usage and activation controls.",
      },
    ],
  }),
  component: ModelsPage,
});


function ModelsPage() {
  return (
    <AppShell promptPlaceholder="Ask about model performance..." rightPanel={<ModelsRail />}>
      <PageHeader
        title="AI Models"
        subtitle="Choose and monitor the intelligence behind January"
        actions={
          <AmberButton>
            <Download className="size-3.5" /> Add Model
          </AmberButton>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Sparkles} label="Available Models" value={0} hint="Installed" />
        <StatCard icon={Zap} label="Active" value={0} hint="Loaded" tone="ok" />
        <StatCard icon={Gauge} label="Avg Latency" value="—" hint="No models" tone="info" />
        <StatCard icon={Activity} label="Tokens Today" value="—" hint="No usage" tone="violet" />
      </div>

      <Toolbar
        placeholder="Search models..."
        selects={[["All Vendors", "Meta", "OpenAI", "Anthropic", "Google"], ["All Types", "Language", "Vision", "Speech", "Image"]]}
      />
      <FilterTabs tabs={["All Models", "Active", "Language", "Multimodal", "Vision", "Speech"]} />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No models available</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Add a model to monitor and manage it from this page.
        </p>
      </Panel>
    </AppShell>
  );
}

function ModelsRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Usage Distribution" action="Analytics" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No usage distribution is available yet.</p>
          <p>Add a model to begin tracking token usage.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Runtime" icon={Layers} />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Runtime statistics will appear once a model is active.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Active Model" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No active model selected.</p>
          <p>Add a model to see its details here.</p>
        </div>
      </Panel>
    </>
  );
}