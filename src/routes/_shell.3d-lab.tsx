import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Boxes,
  Grid3x3,
  Layers,
  Move3d,
  Plus,
  RotateCw,
  Ruler,
  Upload,
} from "lucide-react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { KeyValueList, MediaCard, Thumb, Toolbar } from "@/components/january/cards";
import { Chip, MetricBar, Panel, PanelHeader, StatCard } from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/3d-lab")({
  head: () => ({
    meta: [
      { title: "3D Lab — JANUARY model workspace" },
      {
        name: "description",
        content:
          "Import, inspect and convert 3D models with JANUARY: mesh stats, materials and viewport controls.",
      },
      { property: "og:title", content: "3D Lab — JANUARY" },
      {
        property: "og:description",
        content: "3D viewport, model library, mesh statistics and image-to-3D conversion.",
      },
    ],
  }),
  component: LabPage,
});


function LabPage() {
  return (
    <AppShell promptPlaceholder="Describe a model to generate or edit..." rightPanel={<LabRail />}>
      <PageHeader
        title="3D Lab"
        subtitle="Model viewer, converter and mesh workspace"
        actions={
          <>
            <GhostButton>
              <Upload className="size-3.5" /> Import
            </GhostButton>
            <AmberButton>
              <Plus className="size-3.5" /> Generate 3D
            </AmberButton>
          </>
        }
      />

      <Panel className="mb-3 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
          <h3 className="flex-1 truncate text-[12.5px] text-foreground">No model loaded</h3>
          {[Move3d, RotateCw, Ruler, Grid3x3].map((Icon, i) => (
            <button
              key={i}
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
              disabled
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
        <Thumb icon={Box} seed={0} className="h-[300px] rounded-none border-0" />
        <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline px-3 py-2">
          <Chip tone="amber">System Model</Chip>
          <Chip>Import Required</Chip>
          <Chip>X-Ray</Chip>
          <Chip>Grid On</Chip>
          <span className="ml-auto text-[10px] text-muted-foreground">No model loaded</span>
        </div>
      </Panel>

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Models" value={0} hint="In library" />
        <StatCard icon={Layers} label="Materials" value={0} hint="Assigned" tone="info" />
        <StatCard icon={Ruler} label="Total Size" value="—" hint="Storage used" tone="violet" />
        <StatCard icon={Box} label="Conversions" value={0} hint="This month" tone="ok" />
      </div>

      <Toolbar placeholder="Search models..." selects={[["All Formats", "STEP", "STL", "OBJ", "GLB"]]} />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No 3D models available</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Import a model or generate one with January to begin working in the 3D lab.
        </p>
      </Panel>
    </AppShell>
  );
}

function LabRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Mesh Statistics" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Select a model to view mesh statistics and geometry details.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Render Performance" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Render performance will be shown after a model is loaded into the workspace.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Export" />
        <div className="space-y-1.5 p-3">
          {["GLB / glTF", "STL (Printing)", "STEP (CAD)", "OBJ + MTL"].map((f) => (
            <button
              key={f}
              className="flex w-full items-center gap-2 rounded-lg border border-hairline bg-secondary/40 px-2.5 py-2 text-left text-[11.5px] text-foreground/85 hover:border-amber/40 hover:text-amber"
            >
              <Upload className="size-3.5" /> {f}
            </button>
          ))}
        </div>
      </Panel>
    </>
  );
}