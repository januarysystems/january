import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Project = Tables<"projects">;
export type ChatSession = Tables<"chat_sessions">;
export type ChatMessage = Tables<"chat_messages">;
export type Memory = Tables<"memories">;
export type DocumentRow = Tables<"documents">;
export type UserSettings = Tables<"user_settings">;
export type Notification = Tables<"notifications">;

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/* ---------------- profile + settings ---------------- */

export async function getProfile() {
  const user_id = await uid();
  return unwrap(
    await supabase.from("profiles").select("*").eq("user_id", user_id).maybeSingle(),
  ) as Profile | null;
}

export async function updateProfile(patch: TablesUpdate<"profiles">) {
  const user_id = await uid();
  return unwrap(
    await supabase.from("profiles").update(patch).eq("user_id", user_id).select().single(),
  );
}

export async function getSettings() {
  const user_id = await uid();
  return unwrap(
    await supabase.from("user_settings").select("*").eq("user_id", user_id).maybeSingle(),
  ) as UserSettings | null;
}

export async function updateSettings(patch: TablesUpdate<"user_settings">) {
  const user_id = await uid();
  return unwrap(
    await supabase.from("user_settings").upsert({ ...patch, user_id }, { onConflict: "user_id" }).select().single(),
  );
}

/* ---------------- projects ---------------- */

export async function listProjects() {
  return unwrap(
    await supabase.from("projects").select("*").order("updated_at", { ascending: false }),
  ) as Project[];
}

export async function createProject(input: Omit<TablesInsert<"projects">, "user_id">) {
  const user_id = await uid();
  return unwrap(await supabase.from("projects").insert({ ...input, user_id }).select().single());
}

export async function updateProject(id: string, patch: TablesUpdate<"projects">) {
  return unwrap(await supabase.from("projects").update(patch).eq("id", id).select().single());
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- memories ---------------- */

export async function listMemories() {
  return unwrap(
    await supabase
      .from("memories")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false }),
  ) as Memory[];
}

export async function createMemory(input: Omit<TablesInsert<"memories">, "user_id">) {
  const user_id = await uid();
  return unwrap(await supabase.from("memories").insert({ ...input, user_id }).select().single());
}

export async function updateMemory(id: string, patch: TablesUpdate<"memories">) {
  return unwrap(await supabase.from("memories").update(patch).eq("id", id).select().single());
}

export async function deleteMemory(id: string) {
  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- documents (storage + rows) ---------------- */

export async function listDocuments() {
  return unwrap(
    await supabase.from("documents").select("*").order("created_at", { ascending: false }),
  ) as DocumentRow[];
}

export async function uploadDocument(file: File) {
  const user_id = await uid();
  const path = `${user_id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const up = await supabase.storage.from("documents").upload(path, file);
  if (up.error) throw new Error(up.error.message);
  return unwrap(
    await supabase
      .from("documents")
      .insert({
        user_id,
        name: file.name,
        file_path: path,
        file_type: file.type || file.name.split(".").pop() || "file",
        file_size: file.size,
      })
      .select()
      .single(),
  );
}

export async function documentUrl(path: string) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteDocument(doc: DocumentRow) {
  await supabase.storage.from("documents").remove([doc.file_path]);
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw new Error(error.message);
}

/* ---------------- chat ---------------- */

export async function listSessions() {
  return unwrap(
    await supabase.from("chat_sessions").select("*").order("updated_at", { ascending: false }),
  ) as ChatSession[];
}

export async function createSession(title = "New conversation") {
  const user_id = await uid();
  return unwrap(await supabase.from("chat_sessions").insert({ user_id, title }).select().single());
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from("chat_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listMessages(session_id: string) {
  return unwrap(
    await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true }),
  ) as ChatMessage[];
}

export async function sendMessage(session_id: string, content: string, role = "user") {
  const user_id = await uid();
  const row = unwrap(
    await supabase.from("chat_messages").insert({ session_id, user_id, role, content }).select().single(),
  );
  await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", session_id);
  return row;
}

/* ---------------- notifications ---------------- */

export async function listNotifications() {
  return unwrap(
    await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
  ) as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}
