import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Trash2,
  Upload,
  Loader2,
  Download,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, MediaCard, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  Donut,
  Panel,
  PanelHeader,
  StatCard,
} from "@/components/january/primitives";
import { deleteDocument, documentUrl, listDocuments, uploadDocument, type DocumentRow } from "@/lib/api";

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
        property: "og:description", content: "Searchable document library with AI summaries, storage stats and recent activity." },
    ],
  }),
  component: DocumentsPage,
});

const FILE_ICONS: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  svg: FileImage,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  zip: FileArchive,
  js: FileCode2,
  ts: FileCode2,
  py: FileCode2,
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

function DocumentsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) window.fileInputRef = node;
  }, []);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const remove = useMutation({
    mutationFn: (doc: DocumentRow) => deleteDocument(doc),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return documents;
    return documents.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  const stats = useMemo(() => {
    const totalSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
    return {
      total: documents.length,
      indexed: documents.length,
      starred: 0,
      storage: totalSize,
    };
  }, [documents]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      const ext = (d.file_type || "").split("/").pop()?.toLowerCase() || "unknown";
      counts[ext] = (counts[ext] || 0) + 1;
    });
    return Object.entries(counts);
  }, [documents]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => upload.mutate(file));
      e.target.value = "";
    }
  };

  const handleDownload = async (doc: DocumentRow) => {
    try {
      const url = await documentUrl(doc.file_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to get document URL:", error);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    const ext = (fileType || "").split("/").pop()?.toLowerCase() || "unknown";
    return FILE_ICONS[ext] || FileText;
  };

  return (
    <AppShell promptPlaceholder="Ask about any document..." rightPanel={<DocsRail typeCounts={typeCounts} />}>
      <PageHeader
        title="Documents"
        subtitle="Your searchable, AI-readable knowledge library"
        actions={
          <>
            <GhostButton>
              <FolderOpen className="size-3.5" /> New Folder
            </GhostButton>
            <AmberButton onClick={() => window.fileInputRef?.click()}>
              <Upload className="size-3.5" /> Upload
            </AmberButton>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        }
      />

      {upload.isPending ? (
        <Panel className="mb-3 flex items-center gap-3 px-4 py-2">
          <Loader2 className="size-4 animate-spin text-amber" />
          <span className="text-[12px] text-muted-foreground">Uploading files...</span>
        </Panel>
      ) : null}

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Documents" value={stats.total} hint="All files" />
        <StatCard icon={Sparkles} label="AI Indexed" value={stats.indexed} hint="Searchable" tone="ok" />
        <StatCard icon={Star} label="Starred" value={stats.starred} hint="Quick access" tone="warn" />
        <StatCard icon={HardDrive} label="Storage" value={formatFileSize(stats.storage)} hint="used" tone="info" />
      </div>

      <Toolbar
        placeholder="Search documents..."
        selects={[["All Types", "PDF", "DOC", "XLS", "Code", "Images"], ["Recent", "Name", "Size"]]}
        onSearchChange={setSearchQuery}
        view={view}
        onView={setView}
      />
      <FilterTabs tabs={["All Files", "Recent", "Starred", "Shared", "Indexed"]} />

      {isLoading ? (
        <p className="text-[12px] text-muted-foreground">Loading documents...</p>
      ) : filteredDocs.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-[13px] font-medium text-foreground">No documents yet</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Upload documents and files to build your library here.
          </p>
        </Panel>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filteredDocs.map((doc, i) => {
            const FileIcon = getFileIcon(doc.file_type);
            return (
              <div key={doc.id} className="relative group">
                <MediaCard
                  icon={FileIcon}
                  seed={i}
                  title={doc.name}
                  category={doc.file_type || "file"}
                  description={formatFileSize(doc.file_size || 0)}
                  meta={new Date(doc.created_at).toLocaleDateString()}
                />
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                  >
                    <Download className="size-3.5" />
                  </button>
                  <button
                    onClick={() => remove.mutate(doc)}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel>
          <div className="divide-y divide-[var(--hairline)]">
            {filteredDocs.map((doc) => {
              const FileIcon = getFileIcon(doc.file_type);
              return (
                <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 group">
                  <FileIcon className="size-4 shrink-0 text-amber" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-foreground">{doc.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {formatFileSize(doc.file_size || 0)} • {doc.file_type || "Unknown"}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:block">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                    >
                      <Download className="size-3.5" />
                    </button>
                    <button
                      onClick={() => remove.mutate(doc)}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </AppShell>
  );
}

function DocsRail({ typeCounts }: { typeCounts: [string, number][] }) {
  return (
    <>
      <Panel>
        <PanelHeader title="Storage Breakdown" action="Manage" />
        <div className="p-3">
          <Donut
            total={typeCounts.reduce((sum, [, count]) => sum + count, 0)}
            caption="Files"
            segments={typeCounts.map(([type, count]) => ({
              label: type.toUpperCase(),
              value: count,
              color: "var(--amber)",
            }))}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="AI Summary" icon={Sparkles} />
        <p className="p-3 text-[11.5px] leading-relaxed text-muted-foreground">
          Document summaries and AI indexing will be available in Phase 2.
        </p>
      </Panel>

      <Panel>
        <PanelHeader title="Recent Activity" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Document uploads and changes will appear here.</p>
        </div>
      </Panel>
    </>
  );
}
