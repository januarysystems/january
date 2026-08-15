import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BrainCircuit,
  Clock,
  Database,
  Download,
  Lightbulb,
  Pin,
  Plus,
  Trash2,
  User,
  X,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, Toolbar } from "@/components/january/cards";
import {
  ActivityRow,
  Chip,
  Donut,
  MetricBar,
  Panel,
  PanelHeader,
  StatCard,
} from "@/components/january/primitives";
import { createMemory, deleteMemory, listMemories, updateMemory, type Memory } from "@/lib/api";

export const Route = createFileRoute("/_shell/memory")({
  head: () => ({
    meta: [
      { title: "Memory — what JANUARY remembers about you" },
      {
        name: "description",
        content:
          "Review, pin and prune the facts, preferences and project knowledge JANUARY keeps in long-term memory.",
      },
      { property: "og:title", content: "Memory — JANUARY" },
      {
        property: "og:description", content: "Long-term memory store: personal facts, preferences, project context and skills." },
    ],
  }),
  component: MemoryPage,
});

const CATEGORIES = ["general", "preference", "skill", "project", "personal"];
const CATEGORY_LABEL: Record<string, string> = {
  general: "General",
  preference: "Preference",
  skill: "Skill",
  project: "Project",
  personal: "Personal",
};
const IMPORTANCE_LABEL = [1, 2, 3, 4, 5];

function MemoryPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    category: "general",
    importance: 3,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    category: "general",
    importance: 3,
  });

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ["memories"],
    queryFn: listMemories,
  });

  const create = useMutation({
    mutationFn: () => createMemory(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setIsCreating(false);
      setDraft({ title: "", content: "", category: "general", importance: 3 });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMemory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setEditingId(null);
      setEditForm({ title: "", content: "", category: "general", importance: 3 });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteMemory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["memories"] }),
  });

  const togglePin = useMutation({
    mutationFn: ({ id, is_pinned }: { id: string; is_pinned: boolean }) =>
      updateMemory(id, { is_pinned: !is_pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["memories"] }),
  });

  const filteredMemories = useMemo(() => {
    let filtered = memories;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((m) => m.category === categoryFilter);
    }

    return filtered;
  }, [memories, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const pinned = memories.filter((m) => m.is_pinned).length;
    const thisWeek = memories.filter((m) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(m.created_at) > weekAgo;
    }).length;
    return { total: memories.length, pinned, thisWeek };
  }, [memories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    memories.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return Object.entries(counts);
  }, [memories]);

  const handleEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditForm({
      title: memory.title,
      content: memory.content,
      category: memory.category,
      importance: memory.importance,
    });
  };

  return (
    <AppShell promptPlaceholder="Teach January something new..." rightPanel={<MemoryRail categoryCounts={categoryCounts} />}>
      <PageHeader
        title="Memory"
        subtitle="Everything January remembers about you and your work"
        actions={
          <>
            <GhostButton>
              <Download className="size-3.5" /> Export
            </GhostButton>
            <AmberButton onClick={() => setIsCreating(true)}>
              <Plus className="size-3.5" /> Add Memory
            </AmberButton>
          </>
        }
      />

      {isCreating ? (
        <Panel className="mb-3">
          <PanelHeader title="Add Memory" />
          <form
            className="space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <input
              required
              placeholder="Memory title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] text-foreground outline-none focus:border-amber/50"
            />
            <textarea
              required
              placeholder="Memory content..."
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-hairline bg-secondary/40 px-3 py-2 text-[12.5px] text-foreground outline-none focus:border-amber/50"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="h-10 rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-card">
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
              <select
                value={draft.importance}
                onChange={(e) => setDraft({ ...draft, importance: parseInt(e.target.value) })}
                className="h-10 rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] outline-none focus:border-amber/50"
              >
                {IMPORTANCE_LABEL.map((i) => (
                  <option key={i} value={i} className="bg-card">
                    Importance: {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <AmberButton type="submit" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Save Memory
              </AmberButton>
              <GhostButton type="button" onClick={() => setIsCreating(false)}>
                <X className="size-3.5" /> Cancel
              </GhostButton>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard icon={Database} label="Total Memories" value={stats.total} hint="Stored facts" />
        <StatCard icon={Pin} label="Pinned" value={stats.pinned} hint="Always in context" tone="warn" />
        <StatCard
          icon={Lightbulb}
          label="Learned This Week"
          value={stats.thisWeek}
          hint="New knowledge"
          tone="ok"
        />
        <StatCard
          icon={Database}
          label="Memory Used"
          value={`${Math.round(stats.total * 0.1)} KB`}
          hint="Estimated storage"
          tone="info"
        />
      </div>

      <Toolbar
        placeholder="Search memories..."
        selects={[
          ["All Types", "Preference", "Skill", "Personal", "Project"],
          ["Newest", "Oldest"],
        ]}
        onSearchChange={setSearchQuery}
      />
      <FilterTabs
        tabs={["All", "Pinned", "Preferences", "Skills", "Projects", "Personal"]}
        onTabChange={(tab) => {
          if (tab === "All") setCategoryFilter("all");
          else if (tab === "Pinned") setCategoryFilter("pinned");
          else setCategoryFilter(tab.toLowerCase());
        }}
      />

      {isLoading ? (
        <p className="text-[12px] text-muted-foreground">Loading memories...</p>
      ) : filteredMemories.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-[13px] font-medium text-foreground">No memories yet</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            January will save facts, preferences and project details here once you add them.
          </p>
        </Panel>
      ) : (
        <Panel>
          <div className="divide-y divide-[var(--hairline)]">
            {filteredMemories.map((m) => (
              <div key={m.id} className="group px-4 py-3">
                {editingId === m.id ? (
                  <form
                    className="space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      update.mutate({ id: m.id, data: editForm });
                    }}
                  >
                    <input
                      required
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="h-8 w-full rounded-md border border-hairline bg-secondary/40 px-2 text-[12px] outline-none focus:border-amber/40"
                    />
                    <textarea
                      required
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows={2}
                      className="w-full rounded-md border border-hairline bg-secondary/40 px-2 py-1 text-[12px] outline-none focus:border-amber/40"
                    />
                    <div className="flex gap-2">
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="h-8 rounded-md border border-hairline bg-secondary/40 px-2 text-[12px] outline-none focus:border-amber/40"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c} className="bg-card">
                            {CATEGORY_LABEL[c]}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editForm.importance}
                        onChange={(e) => setEditForm({ ...editForm, importance: parseInt(e.target.value) })}
                        className="h-8 rounded-md border border-hairline bg-secondary/40 px-2 text-[12px] outline-none focus:border-amber/40"
                      >
                        {IMPORTANCE_LABEL.map((i) => (
                          <option key={i} value={i} className="bg-card">
                            Importance: {i}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <AmberButton size="sm" type="submit" disabled={update.isPending}>
                        {update.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
                      </AmberButton>
                      <GhostButton size="sm" type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </GhostButton>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => togglePin.mutate({ id: m.id, is_pinned: m.is_pinned })}
                      className="mt-1 shrink-0"
                    >
                      <Pin
                        className={`size-3.5 ${m.is_pinned ? "text-amber fill-amber" : "text-muted-foreground"}`}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] font-medium text-foreground">{m.title}</span>
                        <Chip>{CATEGORY_LABEL[m.category]}</Chip>
                        <Chip tone={m.importance >= 4 ? "amber" : "info"}>★ {m.importance}</Chip>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{m.content}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(m)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                      >
                        <Download className="size-3.5" />
                      </button>
                      <button
                        onClick={() => remove.mutate(m.id)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </AppShell>
  );
}

function MemoryRail({ categoryCounts }: { categoryCounts: [string, number][] }) {
  return (
    <>
      <Panel>
        <PanelHeader title="Memory Breakdown" action="Details" />
        <div className="p-3">
          <Donut
            total={categoryCounts.reduce((sum, [, count]) => sum + count, 0)}
            caption="Total"
            segments={categoryCounts.map(([cat, count]) => ({
              label: cat.charAt(0).toUpperCase() + cat.slice(1),
              value: count,
              color: "var(--amber)",
            }))}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Storage" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>Memory usage will be tracked once January has saved the first facts.</p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Profile Summary" icon={User} />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>
            Profile details will display here once you add personal preferences and project context.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Recently Learned" action="View All" />
        <div className="p-3 text-[11px] text-muted-foreground">
          <p>No learning history is available yet.</p>
        </div>
      </Panel>
    </>
  );
}
