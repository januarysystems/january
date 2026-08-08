import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  Boxes,
  CheckCircle2,
  CircleDot,
  FolderKanban,
  Loader2,
  PauseCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AmberButton, AppShell, GhostButton, PageHeader } from "@/components/january/AppShell";
import { FilterTabs, MediaCard, Toolbar } from "@/components/january/cards";
import { Donut, Panel, PanelHeader, StatCard } from "@/components/january/primitives";
import { createProject, deleteProject, listProjects, type Project } from "@/lib/api";

export const Route = createFileRoute("/_shell/projects")({
  head: () => ({
    meta: [
      { title: "Projects — JANUARY workspace" },
      {
        name: "description",
        content:
          "Browse, filter and track every JANUARY project across robotics, IoT, hardware and AI.",
      },
      { property: "og:title", content: "Projects — JANUARY" },
      {
        property: "og:description",
        content: "Grid and list views, statuses, categories and progress for all your projects.",
      },
    ],
  }),
  component: ProjectsPage,
});

const STATUSES = ["active", "completed", "on_hold", "archived"] as const;
const TONES: Record<string, "amber" | "ok" | "info" | "violet"> = {
  active: "amber",
  completed: "ok",
  on_hold: "info",
  archived: "violet",
};
const LABEL: Record<string, string> = {
  active: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  archived: "Archived",
};

function ProjectsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", category: "Robotics", status: "active" });

  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: listProjects });

  const create = useMutation({
    mutationFn: () => createProject(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setDraft({ name: "", description: "", category: "Robotics", status: "active" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { active: 0, completed: 0, on_hold: 0, archived: 0 };
    projects.forEach((p) => {
      c[p.status] = (c[p.status] ?? 0) + 1;
    });
    return c;
  }, [projects]);

  return (
    <AppShell
      promptPlaceholder="Ask January about your projects..."
      rightPanel={<ProjectsRail projects={projects} counts={counts} />}
    >
      <PageHeader
        title="Projects"
        subtitle="Manage all your projects in one place"
        actions={
          <AmberButton onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-3.5" /> : <Plus className="size-3.5" />} New Project
          </AmberButton>
        }
      />

      {open ? (
        <Panel className="mb-3">
          <PanelHeader title="Create Project" />
          <form
            className="grid gap-2 p-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Project name"
              className="h-9 rounded-md border border-hairline bg-secondary/40 px-3 text-[12px] outline-none focus:border-amber/40"
            />
            <input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="Category"
              className="h-9 rounded-md border border-hairline bg-secondary/40 px-3 text-[12px] outline-none focus:border-amber/40"
            />
            <input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Short description"
              className="h-9 rounded-md border border-hairline bg-secondary/40 px-3 text-[12px] outline-none focus:border-amber/40 sm:col-span-2"
            />
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              className="h-9 rounded-md border border-hairline bg-secondary/40 px-2 text-[12px] outline-none focus:border-amber/40"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-card">
                  {LABEL[s]}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <AmberButton type="submit" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Create
              </AmberButton>
              <GhostButton type="button" onClick={() => setOpen(false)}>
                Cancel
              </GhostButton>
            </div>
          </form>
        </Panel>
      ) : null}

      <Toolbar
        placeholder="Search projects..."
        selects={[
          ["All Projects", "My Projects", "Shared"],
          ["All Categories", "Robotics", "IoT", "Hardware", "AI / ML"],
          ["Recent", "Name"],
        ]}
        view={view}
        onView={setView}
      />

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={FolderKanban} label="Total Projects" value={projects.length} hint="All projects" />
        <StatCard icon={CircleDot} label="In Progress" value={counts['active'] ?? 0} hint="Currently working" tone="warn" />
        <StatCard icon={CheckCircle2} label="Completed" value={counts['completed'] ?? 0} hint="Successfully done" tone="ok" />
        <StatCard icon={PauseCircle} label="On Hold" value={counts['on_hold'] ?? 0} hint="Paused projects" tone="info" />
        <StatCard icon={Archive} label="Archived" value={counts['archived'] ?? 0} hint="Archived projects" tone="muted" />
      </div>

      {isLoading ? (
        <p className="text-[12px] text-muted-foreground">Loading projects...</p>
      ) : projects.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-[12.5px] text-foreground">No projects yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Create your first project to see it here.
          </p>
        </Panel>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {projects.map((p, i) => (
            <div key={p.id} className="relative">
              <MediaCard
                icon={Boxes}
                seed={i}
                title={p.name}
                category={p.category}
                description={p.description ?? ""}
                meta={new Date(p.updated_at).toLocaleDateString()}
                status={LABEL[p.status] ?? p.status}
                statusTone={TONES[p.status] ?? "amber"}
              />
              <button
                aria-label={`Delete ${p.name}`}
                onClick={() => remove.mutate(p.id)}
                className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-md text-muted-foreground/70 hover:text-danger"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Panel>
          <div className="divide-y divide-[var(--hairline)]">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <Boxes className="size-4 shrink-0 text-amber" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] text-foreground">{p.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{p.description}</p>
                </div>
                <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:block">
                  {p.category}
                </span>
                <span className="shrink-0 text-[10px] text-amber">{LABEL[p.status] ?? p.status}</span>
                <button
                  aria-label={`Delete ${p.name}`}
                  onClick={() => remove.mutate(p.id)}
                  className="shrink-0 text-muted-foreground/60 hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </AppShell>
  );
}

function ProjectsRail({
  projects,
  counts,
}: {
  projects: Project[];
  counts: Record<string, number>;
}) {
  const categories = useMemo(() => {
    const m = new Map<string, number>();
    projects.forEach((p) => m.set(p.category, (m.get(p.category) ?? 0) + 1));
    return [...m.entries()];
  }, [projects]);

  return (
    <>
      <Panel>
        <PanelHeader title="Project Overview" />
        <div className="p-3">
          <Donut
            total={projects.length}
            caption="Total"
            segments={[
              { label: "In Progress", value: counts['active'] ?? 0, color: "var(--amber)" },
              { label: "Completed", value: counts['completed'] ?? 0, color: "var(--ok)" },
              { label: "On Hold", value: counts['on_hold'] ?? 0, color: "var(--info)" },
              { label: "Archived", value: counts['archived'] ?? 0, color: "var(--violet)" },
            ]}
          />
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Project Categories" />
        <ul className="space-y-1.5 p-3 text-[11px]">
          {categories.length === 0 ? (
            <li className="text-muted-foreground">No categories yet</li>
          ) : (
            categories.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-foreground/85">{v}</span>
              </li>
            ))
          )}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader title="Quick Filters" />
        <div className="p-3">
          <FilterTabs tabs={["My Projects", "Starred", "Shared", "Recent"]} />
        </div>
      </Panel>
    </>
  );
}
