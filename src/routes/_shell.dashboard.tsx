import { useQueries } from "@tanstack/react-query";
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
  StatCard,
} from "@/components/january/primitives";
import {
  listAutomations,
  listIoTDevices,
  listMemories,
  listSessions,
  listSimulations,
  list3DAssets,
  listAIModels,
  listDocuments,
  listProjects,
} from "@/lib/api";

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
        property: "og:description", content: "Live AI core, voice control, system monitoring and quick actions." },
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
  const results = useQueries({
    queries: [
      { queryKey: ["projects"], queryFn: listProjects },
      { queryKey: ["chat-sessions"], queryFn: listSessions },
      { queryKey: ["memories"], queryFn: listMemories },
      { queryKey: ["documents"], queryFn: listDocuments },
      { queryKey: ["automations"], queryFn: listAutomations },
      { queryKey: ["ai-models"], queryFn: listAIModels },
      { queryKey: ["simulations"], queryFn: listSimulations },
      { queryKey: ["iot-devices"], queryFn: listIoTDevices },
      { queryKey: ["3d-assets"], queryFn: list3DAssets },
    ],
  });

  const stats = {
    projects: results[0].data?.length ?? 0,
    conversations: results[1].data?.length ?? 0,
    memories: results[2].data?.length ?? 0,
    documents: results[3].data?.length ?? 0,
    automations: results[4].data?.length ?? 0,
    models: results[5].data?.length ?? 0,
    simulations: results[6].data?.length ?? 0,
    devices: results[7].data?.length ?? 0,
    assets3d: results[8].data?.length ?? 0,
  };

  const isLoading = results.some((r) => r.isLoading);

  return (
    <AppShell promptPlaceholder="Type your message or speak...">
      <div className="flex h-full min-h-[560px] gap-3">

        <Panel className="flex min-w-0 flex-1 flex-col p-4">
          <AICore />

          {isLoading ? (
            <div className="mt-4 text-center text-[12px] text-muted-foreground">Loading workspace...</div>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}

