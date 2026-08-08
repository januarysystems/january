import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  Eye,
  Focus,
  Image as ImageIcon,
  Maximize2,
  ScanFace,
  ScanLine,
  Video,
  Zap,
} from "lucide-react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { Thumb, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  Chip,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
  StatusDot,
} from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/vision-camera")({
  head: () => ({
    meta: [
      { title: "Vision & Camera — JANUARY perception suite" },
      {
        name: "description",
        content:
          "Live camera feed, object detection, OCR and image analysis powered by JANUARY vision models.",
      },
      { property: "og:title", content: "Vision & Camera — JANUARY" },
      {
        property: "og:description",
        content: "Real-time detection overlays, capture library and vision model settings.",
      },
    ],
  }),
  component: VisionPage,
});

function VisionPage() {
  return (
    <AppShell promptPlaceholder="Ask January about what it sees..." rightPanel={<VisionRail />}>
      <PageHeader
        title="Vision & Camera"
        subtitle="Real-time perception, detection and image analysis"
        actions={
          <>
            <GhostButton>
              <ImageIcon className="size-3.5" /> Upload Image
            </GhostButton>
            <AmberButton>
              <Camera className="size-3.5" /> Capture
            </AmberButton>
          </>
        }
      />

      <Panel className="mb-3 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
          <Chip tone="amber">
            <StatusDot tone="amber" pulse /> Connected
          </Chip>
          <h3 className="min-w-0 flex-1 truncate text-[12.5px] text-foreground">
            Connected System Camera
          </h3>
          <button
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
            disabled
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
        <Thumb icon={Camera} seed={3} className="h-[320px] rounded-none border-0" />
        <div className="p-4 text-center text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">Camera permission required</p>
          <p className="mt-2 leading-relaxed">
            Grant access to your system camera to view a live feed from the browser.
          </p>
        </div>
      </Panel>

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Camera} label="Cameras" value={0} hint="Awaiting permission" />
        <StatCard icon={Eye} label="Detections" value="—" hint="No data" tone="ok" />
        <StatCard icon={ScanFace} label="Objects Tracked" value="—" hint="No data" tone="info" />
        <StatCard icon={Zap} label="Inference" value="—" hint="No data" tone="violet" />
      </div>

      <Toolbar
        placeholder="Search captures..."
        selects={[["All Tasks", "Detect", "OCR", "Track", "Count"]]}
      />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No captures available</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Captured images and detection results will appear here once the camera is active.
        </p>
      </Panel>
    </AppShell>
  );
}

function VisionRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Detected Objects" action="Clear" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No detection results are available yet.</p>
          <p>Objects will be listed here once the camera starts streaming.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Vision Pipeline" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Vision pipeline stats will appear once a camera source is active.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recent Events" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No vision events have been recorded yet.</p>
        </div>
      </Panel>
    </>
  );
}
