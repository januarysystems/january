import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { WakeWordDetector } from "@/components/january/WakeWordDetector";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const results = useQueries({
    queries: [
      { queryKey: ["projects"], queryFn: () => listProjects().catch(() => []) },
      { queryKey: ["chat-sessions"], queryFn: () => listSessions().catch(() => []) },
      { queryKey: ["memories"], queryFn: () => listMemories().catch(() => []) },
      { queryKey: ["documents"], queryFn: () => listDocuments().catch(() => []) },
      { queryKey: ["automations"], queryFn: () => listAutomations().catch(() => []) },
      { queryKey: ["ai-models"], queryFn: () => listAIModels().catch(() => []) },
      { queryKey: ["simulations"], queryFn: () => listSimulations().catch(() => []) },
      { queryKey: ["iot-devices"], queryFn: () => listIoTDevices().catch(() => []) },
      { queryKey: ["3d-assets"], queryFn: () => list3DAssets().catch(() => []) },
    ],
  });

  const isLoading = results.some((r) => r.isLoading);

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

  // Log for debugging
  console.log('[Dashboard] Rendering with stats:', stats);
  console.log('[Dashboard] Loading state:', isLoading);

  return (
    <AppShell showPromptBar={false}>
      <div className="flex h-full min-h-[560px] gap-3">

        <Panel className="flex min-w-0 flex-1 flex-col p-4">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">JANUARY Dashboard</h1>
              <p className="text-[11px] text-muted-foreground">AI Core command center</p>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-[10px] text-amber">
                <div className="size-2 animate-pulse rounded-full bg-amber" />
                Loading workspace data...
              </div>
            )}
          </div>

          {/* AI Core */}
          <AICore />

          {/* Wake Word Detector */}
          <div className="mt-6">
            <WakeWordDetector />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

