import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Boxes,
  Braces,
  Brain,
  Camera,
  Code2,
  Compass,
  Cpu,
  FileSearch,
  FlaskConical,
  Globe,
  ImageIcon,
  Languages,
  LineChart,
  Mic,
  PenTool,
  ScanLine,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { AICore, Waveform } from "@/components/january/AICore";
import { AppShell } from "@/components/january/AppShell";
import {
  ActivityRow,
  MetricBar,
  Panel,
  PanelHeader,
  QuickActionGrid,
} from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "JANUARY Dashboard — AI Core command center" },
      {
        name: "description",
        content:
          "The JANUARY home dashboard: live AI core, voice control, system monitor and quick actions.",
      },
      { property: "og:title", content: "JANUARY Dashboard" },
      {
        property: "og:description",
        content: "Live AI core, voice control, system monitoring and quick actions.",
      },
    ],
  }),
  component: DashboardPage,
});

const CAPABILITIES = [
  { icon: Search, title: "Web Search", sub: "Real-time information" },
  { icon: Code2, title: "Code Generation", sub: "Multiple languages" },
  { icon: Cpu, title: "IoT Simulator", sub: "Virtual hardware" },
  { icon: Boxes, title: "3D Modeling", sub: "2D to 3D conversion" },
  { icon: FlaskConical, title: "Scientific Engine", sub: "Calculations & predict" },
  { icon: ShieldAlert, title: "Disaster Predictor", sub: "Early warnings" },
  { icon: Camera, title: "Camera Guidance", sub: "Live assistance" },
  { icon: Globe, title: "Multi Language", sub: "100+ languages" },
];

const TOOLS = [
  { icon: FileSearch, title: "Research", sub: "Web & Papers" },
  { icon: Braces, title: "Code", sub: "Write & Debug" },
  { icon: FlaskConical, title: "Simulate", sub: "Run & Test" },
  { icon: LineChart, title: "Analyze", sub: "Data & Model" },
  { icon: PenTool, title: "Design", sub: "3D & CAD" },
  { icon: Brain, title: "Predict", sub: "AI & ML" },
  { icon: Languages, title: "Translate", sub: "Languages" },
  { icon: Compass, title: "Navigate", sub: "GPS & Routes" },
];

function DashboardPage() {
  return (
    <AppShell
      promptPlaceholder="Type your message or speak..."
      rightPanel={<DashboardRail />}
      footer={
        <div className="hidden gap-2 overflow-x-auto pb-0.5 md:flex">
          {TOOLS.map((t) => (
            <button
              key={t.title}
              className="glass-tile flex min-w-[104px] flex-1 items-center gap-2 px-2.5 py-2 text-left transition-colors hover:border-amber/40"
            >
              <t.icon className="size-4 shrink-0 text-amber" />
              <span className="min-w-0">
                <span className="block truncate text-[11px] text-foreground/90">{t.title}</span>
                <span className="block truncate text-[9px] text-muted-foreground">{t.sub}</span>
              </span>
            </button>
          ))}
        </div>
      }
    >
      <div className="flex h-full min-h-[560px] gap-3">
        <div className="hidden w-[170px] shrink-0 flex-col gap-3 lg:flex">
          <Panel className="min-h-0 flex-1">
            <PanelHeader title="Capabilities" />
            <ul className="space-y-0.5 p-1.5">
              {CAPABILITIES.map((c) => (
                <li
                  key={c.title}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/35"
                >
                  <c.icon className="mt-0.5 size-3.5 shrink-0 text-amber" />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] text-foreground/90">
                      {c.title}
                    </span>
                    <span className="block truncate text-[9px] text-muted-foreground">
                      {c.sub}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="shrink-0">
            <PanelHeader title="Active Model" icon={Sparkles} />
            <div className="p-3 text-[11px] text-muted-foreground">
              <p>No active model is selected.</p>
              <p>Add a model to see its current performance here.</p>
            </div>
          </Panel>
        </div>

        <Panel className="flex min-w-0 flex-1 flex-col p-4">
          <AICore />
        </Panel>
      </div>
    </AppShell>
  );
}

function DashboardRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Voice Control" icon={Mic} />
        <div className="space-y-3 p-3">
          <Waveform bars={44} className="h-10 w-full" />
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber/35 bg-secondary/40 py-2 text-[11.5px] text-amber transition-colors hover:bg-accent/50">
            <Mic className="size-3.5" /> Tap to speak
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="System Monitor" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No live system metrics are available.</p>
          <p>System monitoring will appear once the backend is connected.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Quick Actions" />
        <div className="p-3">
          <QuickActionGrid
            actions={[
              { icon: Boxes, label: "New Project" },
              { icon: Code2, label: "Code Editor" },
              { icon: Camera, label: "Take Photo" },
              { icon: ScanLine, label: "Scan Document" },
              { icon: ImageIcon, label: "Generate Image" },
              { icon: Mic, label: "Voice Command" },
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recent Projects" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No recent project activity is available.</p>
          <p>Create or connect to a project to see it listed here.</p>
        </div>
      </Panel>
    </>
  );
}