import {
  Bot,
  BrainCircuit,
  Boxes,
  Camera,
  Cpu,
  FileText,
  FlaskConical,
  Home,
  MessageSquare,
  Settings,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { label: string; to: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/dashboard", icon: Home },
  { label: "Chat", to: "/chat", icon: MessageSquare },
  { label: "Projects", to: "/projects", icon: Boxes },
  { label: "Memory", to: "/memory", icon: BrainCircuit },
  { label: "AI Models", to: "/ai-models", icon: Sparkles },
  { label: "Automations", to: "/automations", icon: Workflow },
  { label: "Simulations", to: "/simulations", icon: FlaskConical },
  { label: "3D Lab", to: "/3d-lab", icon: Cpu },
  { label: "IoT & Robotics", to: "/iot-robotics", icon: Bot },
  { label: "Vision & Camera", to: "/vision-camera", icon: Camera },
  { label: "Documents", to: "/documents", icon: FileText },
  { label: "Settings", to: "/settings", icon: Settings },
];