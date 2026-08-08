import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Mail, User } from "lucide-react";
import { useEffect, useState } from "react";

import { AmberButton, AppShell, PageHeader } from "@/components/january/AppShell";
import { Panel, PanelHeader } from "@/components/january/primitives";
import { getProfile, updateProfile } from "@/lib/api";

export const Route = createFileRoute("/_shell/profile")({
  head: () => ({
    meta: [
      { title: "Profile — your JANUARY account" },
      {
        name: "description",
        content: "Update your JANUARY display name, avatar and assistant preferences.",
      },
      { property: "og:title", content: "Profile — JANUARY" },
      {
        property: "og:description",
        content: "Manage your JANUARY identity, avatar and language preferences.",
      },
    ],
  }),
  component: ProfilePage,
});

function Field({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11.5px] text-foreground/85">{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-hairline bg-secondary/40 px-3 text-[12.5px] text-foreground outline-none focus:border-amber/50"
        {...rest}
      />
    </label>
  );
}

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const [form, setForm] = useState({ full_name: "", avatar_url: "", preferred_language: "en" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        avatar_url: profile.avatar_url ?? "",
        preferred_language: profile.preferred_language ?? "en",
      });
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => updateProfile(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <AppShell promptPlaceholder="Ask January about your account...">
      <PageHeader title="Profile" subtitle="Your identity across the January workspace" />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel>
          <PanelHeader title="Account Details" icon={User} />
          <form
            className="space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field
              label="Full Name"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Your name"
            />
            <Field label="Email" value={profile?.email ?? ""} readOnly disabled />
            <Field
              label="Avatar URL"
              value={form.avatar_url}
              onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
              placeholder="https://..."
            />
            <Field
              label="Preferred Language"
              value={form.preferred_language}
              onChange={(e) => setForm((f) => ({ ...f, preferred_language: e.target.value }))}
              placeholder="en"
            />
            <div className="flex items-center gap-2">
              <AmberButton type="submit" disabled={save.isPending || isLoading}>
                {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null} Save Changes
              </AmberButton>
              {saved ? (
                <span className="flex items-center gap-1 text-[11px] text-ok">
                  <Check className="size-3.5" /> Saved
                </span>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel className="h-fit">
          <PanelHeader title="Preview" icon={Mail} />
          <div className="flex flex-col items-center gap-2 p-5 text-center">
            <span className="grid size-20 place-items-center overflow-hidden rounded-full border border-amber/40 bg-secondary/60 text-amber">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                <User className="size-8" />
              )}
            </span>
            <p className="text-[13px] text-foreground">{form.full_name || "Unnamed"}</p>
            <p className="text-[11px] text-muted-foreground">{profile?.email}</p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
