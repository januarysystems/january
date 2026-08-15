import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Boxes,
  Download,
  Grid3x3,
  Layers,
  Loader2,
  Move3d,
  Plus,
  RotateCw,
  Ruler,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { KeyValueList, MediaCard, Thumb, Toolbar } from "@/components/january/cards";
import { Chip, MetricBar, Panel, PanelHeader, StatCard } from "@/components/january/primitives";
import { asset3DUrl, delete3DAsset, list3DAssets, type Asset3D, upload3DAsset } from "@/lib/api";

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
        property: "og:description", content: "3D viewport, model library, mesh statistics and image-to-3D conversion." },
    ],
  }),
  component: LabPage,
});

const FILE_ICONS: Record<string, any> = {
  glb: Box,
  gltf: Box,
  obj: Box,
  stl: Box,
  step: Box,
  stp: Box,
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

function LabPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedAsset, setSelectedAsset] = useState<Asset3D | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) window.file3DInputRef = node;
  }, []);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["3d-assets"],
    queryFn: list3DAssets,
  });

  const upload = useMutation({
    mutationFn: (file: File) => upload3DAsset(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["3d-assets"] });
    },
  });

  const remove = useMutation({
    mutationFn: (asset: Asset3D) => delete3DAsset(asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["3d-assets"] });
      setSelectedAsset(null);
    },
  });

  const stats = useMemo(() => {
    const totalSize = assets.reduce((sum, a) => sum + (a.file_size || 0), 0);
    const materials = assets.length;
    return {
      total: assets.length,
      materials,
      storage: totalSize,
      conversions: 0,
    };
  }, [assets]);

  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((a) => {
      const format = a.format_type || "unknown";
      counts[format] = (counts[format] || 0) + 1;
    });
    return Object.entries(counts);
  }, [assets]);

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => upload.mutate(file));
      e.target.value = "";
    }
  };

  const handleDownload = async (asset: Asset3D) => {
    try {
      const url = await asset3DUrl(asset.file_path);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to get asset URL:", error);
    }
  };

  const getFileIcon = (fileType: string) => {
    return FILE_ICONS[fileType] || Box;
  };

  return (
    <AppShell promptPlaceholder="Describe a model to generate or edit..." rightPanel={<LabRail formatCounts={formatCounts} />}>
      <PageHeader
        title="3D Lab"
        subtitle="Model viewer, converter and mesh workspace"
        actions={
          <>
            <GhostButton onClick={() => window.file3DInputRef?.click()}>
              <Upload className="size-3.5" /> Import
            </GhostButton>
            <AmberButton>
              <Plus className="size-3.5" /> Generate 3D
            </AmberButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.obj,.stl,.step,.stp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        }
      />

      {upload.isPending ? (
        <Panel className="mb-3 flex items-center gap-3 px-4 py-2">
          <Loader2 className="size-4 animate-spin text-amber" />
          <span className="text-[12px] text-muted-foreground">Uploading 3D model...</span>
        </Panel>
      ) : null}

      <Panel className="mb-3 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
          <h3 className="flex-1 truncate text-[12.5px] text-foreground">
            {selectedAsset ? selectedAsset.name : "No model loaded"}
          </h3>
          {[Move3d, RotateCw, Ruler, Grid3x3].map((Icon, i) => (
            <button
              key={i}
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
              disabled={!selectedAsset}
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
        {selectedAsset ? (
          <div className="relative">
            <Thumb icon={getFileIcon(selectedAsset.file_type)} seed={0} className="h-[300px] rounded-none border-0" />
            <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline px-3 py-2">
              <Chip tone="amber">{selectedAsset.format_type || "Unknown"}</Chip>
              <Chip>{formatFileSize(selectedAsset.file_size)}</Chip>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {new Date(selectedAsset.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <>
            <Thumb icon={Box} seed={0} className="h-[300px] rounded-none border-0" />
            <div className="p-4 text-center text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">Import a model to view it here</p>
              <p className="mt-2 leading-relaxed">
                Supported formats: GLB, glTF, OBJ, STL, STEP
              </p>
            </div>
          </>
        )}
      </Panel>

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Models" value={stats.total} hint="In library" />
        <StatCard icon={Layers} label="Materials" value={stats.materials} hint="Available" tone="info" />
        <StatCard icon={Ruler} label="Total Size" value={formatFileSize(stats.storage)} hint="Storage used" tone="violet" />
        <StatCard icon={Box} label="Conversions" value={stats.conversions} hint="This month" tone="ok" />
      </div>

      <Toolbar
        placeholder="Search models..."
        selects={[["All Formats", "STEP", "STL", "OBJ", "GLB"]]}
        onSearchChange={setSearchQuery}
        view={view}
        onView={setView}
      />

      {isLoading ? (
        <p className="text-[12px] text-muted-foreground">Loading models...</p>
      ) : filteredAssets.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-[13px] font-medium text-foreground">No 3D models available</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Import a model or generate one with January to begin working in the 3D lab.
          </p>
        </Panel>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredAssets.map((asset, i) => {
            const FileIcon = getFileIcon(asset.file_type);
            return (
              <div
                key={asset.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedAsset(asset)}
              >
                <MediaCard
                  icon={FileIcon}
                  seed={i}
                  title={asset.name}
                  category={asset.format_type || "Unknown format"}
                  description={formatFileSize(asset.file_size)}
                  meta={new Date(asset.created_at).toLocaleDateString()}
                />
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(asset);
                    }}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                  >
                    <Download className="size-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${asset.name}"?`)) {
                        remove.mutate(asset);
                      }
                    }}
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
            {filteredAssets.map((asset) => {
              const FileIcon = getFileIcon(asset.file_type);
              return (
                <div
                  key={asset.id}
                  className="group flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/20"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <FileIcon className="size-4 shrink-0 text-amber" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-foreground">{asset.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {formatFileSize(asset.file_size)} • {asset.format_type || "Unknown"}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:block">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(asset);
                      }}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                    >
                      <Download className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${asset.name}"?`)) {
                          remove.mutate(asset);
                        }
                      }}
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

function LabRail({ formatCounts }: { formatCounts: [string, number][] }) {
  return (
    <>
      <Panel>
        <PanelHeader title="Mesh Statistics" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Select a model to view mesh statistics and geometry details.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Format Distribution" />
        <ul className="space-y-1.5 p-3 text-[11px]">
          {formatCounts.length === 0 ? (
            <li className="text-muted-foreground">No models yet</li>
          ) : (
            formatCounts.map(([format, count]) => (
              <li key={format} className="flex items-center justify-between">
                <span className="text-muted-foreground">{format}</span>
                <span className="text-foreground/85">{count}</span>
              </li>
            ))
          )}
        </ul>
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
