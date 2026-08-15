import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Cpu,
  Download,
  Eye,
  EyeOff,
  Gauge,
  KeyRound,
  Layers,
  Loader2,
  Play,
  Plus,
  Settings2,
  Sparkles,
  StopCircle,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, KeyValueList, Toolbar } from "@/components/january/cards";
import {
  Chip,
  Donut,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
  StatusDot,
} from "@/components/january/primitives";
import { createAIModel, deleteAIModel, listAIModels, removeModelApiKey, storeModelApiKey, type AIModel, updateAIModel } from "@/lib/api";

export const Route = createFileRoute("/_shell/ai-models")({
  head: () => ({
    meta: [
      { title: "AI Models — JANUARY model control room" },
      {
        name: "description",
        content:
          "Compare, activate and monitor the language, vision and speech models powering JANUARY.",
      },
      { property: "og:title", content: "AI Models — JANUARY" },
      {
        property: "og:description", content: "Model catalogue with latency, context window, usage and activation controls." },
    ],
  }),
  component: ModelsPage,
});

const PROVIDERS = ["local", "openai", "anthropic", "google", "meta", "cohere", "puter", "custom"];
const MODEL_TYPES = ["language", "vision", "speech", "image", "multimodal"];
const STATUSES = ["inactive", "active", "loading", "error"];

function ModelsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKeyDialog, setApiKeyDialog] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    provider: "local",
    model_name: "",
    version: "",
    status: "inactive",
    description: "",
    apiKey: "",
  });
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["ai-models"],
    queryFn: listAIModels,
  });

  const create = useMutation({
    mutationFn: async () => {
      console.log("Creating model with data:", draft);
      const result = await createAIModel(draft);
      console.log("Model created successfully:", result);
      return result;
    },
    onSuccess: async (data) => {
      console.log("Create success callback with data:", data);

      // Store API key if provided (but not for Puter - it doesn't need keys)
      if (draft.provider !== "puter" && draft.apiKey && draft.apiKey.trim()) {
        try {
          console.log("Storing API key for model:", data.id);
          await storeModelApiKey(data.id, draft.apiKey.trim());
          console.log("API key stored successfully");
        } catch (error) {
          console.error("Failed to store API key:", error);
          alert("Model created but failed to store API key. You can add it later.");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      setIsCreating(false);
      setDraft({
        name: "",
        provider: "local",
        model_name: "",
        version: "",
        status: "inactive",
        description: "",
        apiKey: "",
      });
    },
    onError: (error) => {
      console.error("Failed to create model:", error);
      alert(`Failed to create model: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  const storeKey = useMutation({
    mutationFn: ({ modelId, apiKey }: { modelId: string; apiKey: string }) =>
      storeModelApiKey(modelId, apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      setApiKeyDialog(null);
      setShowApiKey(false);
    },
  });

  const removeKey = useMutation({
    mutationFn: (modelId: string) => removeModelApiKey(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      setApiKeyDialog(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAIModel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-models"] }),
  });

  const activateModel = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAIModel(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-models"] }),
  });

  const stats = useMemo(() => {
    const active = models.filter((m) => m.status === "active").length;
    const total = models.length;
    return { available: total, active, avgLatency: "—", tokens: "—" };
  }, [models]);

  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    models.forEach((m) => {
      counts[m.provider] = (counts[m.provider] || 0) + 1;
    });
    return Object.entries(counts);
  }, [models]);

  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.model_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell promptPlaceholder="Ask about model performance..." rightPanel={<ModelsRail providerCounts={providerCounts} activeModelId={activeModelId} />}>
      <PageHeader
        title="AI Models"
        subtitle="Choose and monitor the intelligence behind January"
        actions={
          <div className="flex gap-2">
            <AmberButton
              onClick={() => {
                // Quick add Puter model
                setDraft({
                  name: "JANUARY (Puter AI)",
                  provider: "puter",
                  model_name: "gpt-5.4-nano",
                  version: "v2",
                  status: "active",
                  description: "JANUARY's default AI assistant powered by Puter.js - no API key required",
                  apiKey: "",
                });
                setIsCreating(true);
              }}
              className="bg-gradient-to-r from-amber to-amber/80"
            >
              <Sparkles className="size-3.5" /> Add Puter
            </AmberButton>
            <AmberButton onClick={() => setIsCreating(true)}>
              <Download className="size-3.5" /> Add Model
            </AmberButton>
          </div>
        }
      />

      {isCreating ? (
        <Panel className="mb-3">
          <PanelHeader title="Add AI Model" />
          <form
            className="grid gap-3 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Form submitted with draft:", draft);

              // Basic validation
              if (!draft.name || !draft.model_name) {
                alert("Please fill in the required fields");
                return;
              }

              console.log("Calling create mutation...");
              create.mutate();
            }}
          >
            <input
              required
              placeholder="Display name (e.g., GPT-4)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <input
              required
              placeholder="Model identifier (e.g., gpt-4-turbo)"
              value={draft.model_name}
              onChange={(e) => setDraft({ ...draft, model_name: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <select
              value={draft.provider}
              onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
              className="h-10 rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p} className="bg-card">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <input
              placeholder="Version (optional)"
              value={draft.version}
              onChange={(e) => setDraft({ ...draft, version: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
            />
            <div className="relative">
              <input
                placeholder="API Key (optional - encrypted at rest)"
                value={draft.apiKey}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                type={showApiKey ? "text" : "password"}
                className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 pr-20 text-[12.5px] outline-none focus:border-amber/50"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground sm:col-span-2">
              💡 Leave API key empty to use environment variables, or add your own key for this model only.
            </p>
            <input
              placeholder="Brief description (optional)"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50 sm:col-span-2"
            />
            <div className="flex gap-2 sm:col-span-2">
              <AmberButton type="submit" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Add Model
              </AmberButton>
              <GhostButton type="button" onClick={() => setIsCreating(false)}>
                <X className="size-3.5" /> Cancel
              </GhostButton>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Sparkles} label="Available Models" value={stats.available} hint="In registry" />
        <StatCard icon={Zap} label="Active" value={stats.active} hint="Loaded" tone="ok" />
        <StatCard icon={Gauge} label="Avg Latency" value={stats.avgLatency} hint="No active models" tone="info" />
        <StatCard icon={Activity} label="Tokens Today" value={stats.tokens} hint="No usage yet" tone="violet" />
      </div>

      <Toolbar
        placeholder="Search models..."
        selects={[["All Vendors", "Meta", "OpenAI", "Anthropic", "Google", "Local"], ["All Types", "Language", "Vision", "Speech", "Image"]]}
        onSearchChange={setSearchQuery}
      />
      <FilterTabs tabs={["All Models", "Active", "Language", "Multimodal", "Vision", "Speech"]} />

      {isLoading ? (
        <p className="text-[12px] text-muted-foreground">Loading models...</p>
      ) : filteredModels.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-[13px] font-medium text-foreground">No models in registry</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Add a model to monitor and manage it from this page.
          </p>
        </Panel>
      ) : (
        <Panel>
          <div className="divide-y divide-[var(--hairline)]">
            {filteredModels.map((model) => (
              <div key={model.id} className="group px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-medium text-foreground">
                        {model.name}
                      </span>
                      <Chip>{model.provider}</Chip>
                      <Chip tone={model.status === "active" ? "ok" : model.status === "error" ? "danger" : "amber"}>
                        <StatusDot tone={model.status === "active" ? "ok" : model.status === "error" ? "danger" : "amber"} />
                        {model.status}
                      </Chip>
                      {(model as any).has_custom_key && (
                        <Chip tone="violet" icon={KeyRound}>
                          Custom Key
                        </Chip>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {model.model_name} {model.version ? `v${model.version}` : ""} • {model.description || "No description"}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setApiKeyDialog(model.id)}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                      title="Manage API Key"
                    >
                      <KeyRound className="size-3.5" />
                    </button>
                    {model.status === "inactive" || model.status === "error" ? (
                      <button
                        onClick={() => {
                          activateModel.mutate({ id: model.id, status: "active" });
                          setActiveModelId(model.id);
                        }}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-ok"
                      >
                        <Play className="size-3.5" />
                      </button>
                    ) : model.status === "active" ? (
                      <button
                        onClick={() => {
                          activateModel.mutate({ id: model.id, status: "inactive" });
                          setActiveModelId(null);
                        }}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                      >
                        <StopCircle className="size-3.5" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${model.name}" from the registry?`)) {
                          remove.mutate(model.id);
                        }
                      }}
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* API Key Management Dialog */}
      {apiKeyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Panel className="w-full max-w-md">
            <PanelHeader
              title="Manage API Key"
              icon={KeyRound}
              action={<X className="size-4 cursor-pointer" onClick={() => setApiKeyDialog(null)} />}
            />
            <div className="space-y-3 p-4">
              {/* Special message for Puter models */}
              {(models.find((m) => m.id === apiKeyDialog))?.provider === "puter" ? (
                <div className="rounded-lg bg-amber/10 border border-amber/30 p-4 text-center">
                  <Sparkles className="mx-auto mb-2 size-8 text-amber" />
                  <p className="text-[12px] font-medium text-foreground">Puter AI</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Puter models don't require API keys! They use Puter.js which provides free AI access directly in the browser.
                  </p>
                  <div className="mt-3 text-[10px] text-muted-foreground">
                    Learn more at <a href="https://puter.com" target="_blank" rel="noopener noreferrer" className="text-amber hover:underline">puter.com</a>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-[11px] text-muted-foreground">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter API key (sk-...)"
                        className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 pr-20 text-[12.5px] outline-none focus:border-amber/50"
                        id="api-key-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    🔒 API keys are encrypted at rest using AES-256-GCM encryption.
                    Your keys are stored securely and never exposed to the browser.
                  </p>
                </>
              )}

              <div className="flex gap-2">
                {(models.find((m) => m.id === apiKeyDialog))?.provider !== "puter" && (
                  <>
                    {(models.find((m) => m.id === apiKeyDialog) as any)?.has_custom_key && (
                      <GhostButton
                        onClick={() => {
                          if (confirm("Remove stored API key for this model?")) {
                            removeKey.mutate(apiKeyDialog);
                          }
                        }}
                        disabled={removeKey.isPending}
                      >
                        {removeKey.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Remove
                      </GhostButton>
                    )}
                    <AmberButton
                      onClick={() => {
                        const input = document.getElementById("api-key-input") as HTMLInputElement;
                        if (input?.value) {
                          storeKey.mutate({
                            modelId: apiKeyDialog,
                            apiKey: input.value,
                          });
                        }
                      }}
                      disabled={storeKey.isPending}
                      className="flex-1"
                    >
                      {storeKey.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Save Key
                    </AmberButton>
                  </>
                )}
                {/* For Puter models, just show a close button */}
                {(models.find((m) => m.id === apiKeyDialog))?.provider === "puter" && (
                  <AmberButton onClick={() => setApiKeyDialog(null)} className="w-full">
                    Got it
                  </AmberButton>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}
    </AppShell>
  );
}

function ModelsRail({ providerCounts, activeModelId }: { providerCounts: [string, number][]; activeModelId: string | null }) {
  return (
    <>
      <Panel>
        <PanelHeader title="Usage Distribution" action="Analytics" />
        <div className="p-3">
          <Donut
            total={providerCounts.reduce((sum, [, count]) => sum + count, 0)}
            caption="Models"
            segments={providerCounts.map(([provider, count]) => ({
              label: provider.charAt(0).toUpperCase() + provider.slice(1),
              value: count,
              color: "var(--amber)",
            }))}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Runtime" icon={Layers} />
        <div className="p-3 text-[11px] text-muted-foreground">
          {!activeModelId ? (
            <p>Runtime statistics will appear once a model is active.</p>
          ) : (
            <p>Runtime monitoring will be available in Phase 2.</p>
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Active Model" />
        <div className="p-3 text-[11px] text-muted-foreground">
          {!activeModelId ? (
            <p>No active model selected.</p>
          ) : (
            <p>The selected model is registered as active. AI responses will be available in Phase 2.</p>
          )}
        </div>
      </Panel>
    </>
  );
}
