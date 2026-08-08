import { createFileRoute } from "@tanstack/react-router";
import {
  Bookmark,
  Code2,
  Copy,
  FileText,
  Globe,
  ImageIcon,
  Languages,
  Mic,
  MoreVertical,
  Pin,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Waveform } from "@/components/january/AICore";
import { AppShell } from "@/components/january/AppShell";
import { JanuaryMark } from "@/components/january/Logo";
import { MetricBar, Panel, PanelHeader, QuickActionGrid } from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/chat")({
  head: () => ({
    meta: [
      { title: "Chat — JANUARY intelligent assistant" },
      {
        name: "description",
        content:
          "Converse with JANUARY: markdown and code-block ready chat with voice, attachments and context.",
      },
      { property: "og:title", content: "Chat — JANUARY" },
      {
        property: "og:description",
        content: "Markdown and code-ready AI conversation workspace with voice input.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <AppShell promptPlaceholder="Type your message or speak..." rightPanel={<ChatRail />}>
      <div className="flex h-full min-h-[560px] gap-3">
        <Panel className="hidden w-[224px] shrink-0 flex-col md:flex">
          <PanelHeader title="Conversations" action={<Plus className="size-4 text-amber" />} />
          <div className="p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search conversations..."
                className="h-8 w-full rounded-md border border-hairline bg-secondary/40 pr-2 pl-8 text-[11px] outline-none focus:border-amber/40"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-hairline bg-secondary/40 p-6 text-center text-[11px] text-muted-foreground">
              <p className="text-[12px] font-medium text-foreground">No conversations yet</p>
              <p className="mt-2 max-w-[240px] leading-relaxed">
                Your recent chats will appear here once you start a conversation with January.
              </p>
            </div>
          </div>
          <div className="border-t border-hairline p-2">
            <button className="w-full rounded-md border border-hairline bg-secondary/40 py-1.5 text-[10.5px] text-foreground/80 hover:border-amber/40 hover:text-amber">
              View All Conversations
            </button>
          </div>
        </Panel>

        <Panel className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
            <h3 className="min-w-0 flex-1 truncate text-[13px] text-foreground">
              No conversations selected
            </h3>
            {[Pin, Share2, Trash2, MoreVertical].map((Icon, i) => (
              <button
                key={i}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                disabled
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 p-4">
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl border border-hairline bg-secondary/40 px-6 py-5">
                <p className="text-[13px] font-medium text-foreground">No active conversation</p>
                <p className="mt-2 max-w-[320px] text-[11px] leading-relaxed text-muted-foreground">
                  Start a conversation with January using the prompt at the bottom or create a new
                  chat from the sidebar.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function ChatRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Voice Control" icon={Mic} />
        <div className="space-y-3 p-3">
          <Waveform bars={44} className="h-10 w-full" />
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber/35 bg-secondary/40 py-2 text-[11.5px] text-amber hover:bg-accent/50">
            <Mic className="size-3.5" /> Listening...
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="System Monitor" action="View All" />
        <div className="space-y-2 p-3 text-[11px] text-muted-foreground">
          <p>No live system metrics are available.</p>
          <p>System monitoring will appear once the assistant is connected to a backend service.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Conversation Context" action="Clear All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No conversation context is available yet.</p>
          <p>Start a chat to see relevant context and settings here.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Quick Actions" />
        <div className="p-3">
          <QuickActionGrid
            actions={[
              { icon: FileText, label: "Summarize" },
              { icon: Code2, label: "Explain Code" },
              { icon: Bookmark, label: "Debug Code" },
              { icon: Languages, label: "Translate" },
              { icon: ImageIcon, label: "Generate Image" },
              { icon: Globe, label: "Voice Command" },
            ]}
          />
        </div>
      </Panel>
    </>
  );
}
