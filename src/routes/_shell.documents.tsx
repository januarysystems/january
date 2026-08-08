import { createFileRoute } from "@tanstack/react-router";
import {
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  HardDrive,
  MoreVertical,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, MediaCard, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  Donut,
  Panel,
  PanelHeader,
  StatCard,
} from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/documents")({
  head: () => ({
    meta: [
      { title: "Documents — JANUARY knowledge library" },
      {
        name: "description",
        content:
          "Upload datasheets, reports and code files so JANUARY can read, summarise and cite them.",
      },
      { property: "og:title", content: "Documents — JANUARY" },
      {
        property: "og:description",
        content: "Searchable document library with AI summaries, storage stats and recent activity.",
      },
    ],
  }),
  component: DocumentsPage,
});


function DocumentsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <AppShell promptPlaceholder="Ask about any document..." rightPanel={<DocsRail />}>
      <PageHeader
        title="Documents"
        subtitle="Your searchable, AI-readable knowledge library"
        actions={
          <>
            <GhostButton>
              <FolderOpen className="size-3.5" /> New Folder
            </GhostButton>
            <AmberButton>
              <Upload className="size-3.5" /> Upload
            </AmberButton>
          </>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Documents" value={0} hint="All files" />
        <StatCard icon={Sparkles} label="AI Indexed" value={0} hint="Searchable" tone="ok" />
        <StatCard icon={Star} label="Starred" value={0} hint="Quick access" tone="warn" />
        <StatCard icon={HardDrive} label="Storage" value="0 GB" hint="of 20 GB" tone="info" />
      </div>

      <Toolbar
        placeholder="Search documents..."
        selects={[["All Types", "PDF", "DOC", "XLS", "Code", "Images"], ["Recent", "Name", "Size"]]}
        view={view}
        onView={setView}
      />
      <FilterTabs tabs={["All Files", "Recent", "Starred", "Shared", "Indexed"]} />

      <Panel className="p-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No documents yet</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Upload documents and files to build your library here.
        </p>
      </Panel>
    </AppShell>
  );
}

function DocsRail() {
  return (
    <>
      <Panel>
        <PanelHeader title="Storage Breakdown" action="Manage" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No storage data is available yet.</p>
          <p>Your document usage will appear here after uploading files.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="AI Summary" icon={Sparkles} />
        <p className="p-3 text-[11.5px] leading-relaxed text-muted-foreground">
          January can summarise uploaded documents once your library contains files.
        </p>
      </Panel>

      <Panel>
        <PanelHeader title="Recent Activity" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No document activity yet.</p>
        </div>
      </Panel>
    </>
  );
}