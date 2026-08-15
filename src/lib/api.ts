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
export type AIModel = Tables<"ai_models">;
export type Automation = Tables<"automations">;
export type Simulation = { id: string; user_id: string; name: string; description: string | null; category: string; status: string; project_id: string | null; created_at: string; updated_at: string };
export type IoTDevice = { id: string; user_id: string; name: string; device_type: string; device_id: string | null; connection_type: string | null; connection_config: string | null; status: string; last_seen: string | null; description: string | null; created_at: string; updated_at: string };
export type Asset3D = { id: string; user_id: string; name: string; file_path: string; file_type: string; file_size: number; format_type: string | null; metadata: any; project_id: string | null; created_at: string; updated_at: string };

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

/* ---------------- ai models ---------------- */

export async function listAIModels() {
  const result = await supabase.from("ai_models").select("*").order("created_at", { ascending: false });
  if (result.error) throw new Error(result.error.message);
  return (result.data as AIModel[]) || [];
}

export async function createAIModel(input: Omit<TablesInsert<"ai_models">, "user_id">) {
  const user_id = await uid();
  console.log("Creating AI model with input:", input, "for user:", user_id);

  // Remove apiKey from input as it should be handled separately
  const { apiKey, ...modelData } = input as any;

  try {
    const result = await supabase.from("ai_models").insert({ ...modelData, user_id }).select().single();
    console.log("AI model creation result:", result);
    return unwrap(result);
  } catch (error) {
    console.error("Error creating AI model:", error);
    throw error;
  }
}

export async function updateAIModel(id: string, patch: TablesUpdate<"ai_models">) {
  // Remove apiKey from patch as it should be handled separately
  const { apiKey, ...modelData } = patch as any;
  return unwrap(await supabase.from("ai_models").update(modelData).eq("id", id).select().single());
}

export async function deleteAIModel(id: string) {
  const { error } = await supabase.from("ai_models").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Store encrypted API key for an AI model
 * This is a server-side operation that encrypts the key before storage
 */
export async function storeModelApiKey(modelId: string, apiKey: string) {
  // Import server function from TanStack Start route
  const { storeModelKey } = await import("@/routes/-api.ai.keys");
  return storeModelKey({ modelId, apiKey });
}

/**
 * Remove API key from an AI model
 */
export async function removeModelApiKey(modelId: string) {
  // Import server function from TanStack Start route
  const { removeModelKey } = await import("@/routes/-api.ai.keys");
  return removeModelKey({ modelId });
}

/* ---------------- automations ---------------- */

export async function listAutomations() {
  return unwrap(
    await supabase.from("automations").select("*").order("created_at", { ascending: false }),
  ) as Automation[];
}

export async function createAutomation(input: Omit<TablesInsert<"automations">, "user_id">) {
  const user_id = await uid();
  return unwrap(await supabase.from("automations").insert({ ...input, user_id }).select().single());
}

export async function updateAutomation(id: string, patch: TablesUpdate<"automations">) {
  return unwrap(await supabase.from("automations").update(patch).eq("id", id).select().single());
}

export async function deleteAutomation(id: string) {
  const { error } = await supabase.from("automations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- simulations ---------------- */

export async function listSimulations() {
  return unwrap(
    await supabase.from("simulations").select("*").order("updated_at", { ascending: false }),
  ) as Simulation[];
}

export async function createSimulation(input: Omit<any, "user_id" | "id" | "created_at" | "updated_at">) {
  const user_id = await uid();
  return unwrap(
    await supabase
      .from("simulations")
      .insert({ ...input, user_id })
      .select()
      .single(),
  );
}

export async function updateSimulation(id: string, patch: Partial<Simulation>) {
  return unwrap(await supabase.from("simulations").update(patch).eq("id", id).select().single());
}

export async function deleteSimulation(id: string) {
  const { error } = await supabase.from("simulations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- iot devices ---------------- */

export async function listIoTDevices() {
  return unwrap(
    await supabase.from("iot_devices").select("*").order("created_at", { ascending: false }),
  ) as IoTDevice[];
}

export async function createIoTDevice(input: Omit<any, "user_id" | "id" | "created_at" | "updated_at">) {
  const user_id = await uid();
  return unwrap(
    await supabase
      .from("iot_devices")
      .insert({ ...input, user_id })
      .select()
      .single(),
  );
}

export async function updateIoTDevice(id: string, patch: Partial<IoTDevice>) {
  return unwrap(await supabase.from("iot_devices").update(patch).eq("id", id).select().single());
}

export async function deleteIoTDevice(id: string) {
  const { error } = await supabase.from("iot_devices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- 3d assets ---------------- */

export async function list3DAssets() {
  return unwrap(
    await supabase.from("assets_3d").select("*").order("created_at", { ascending: false }),
  ) as Asset3D[];
}

export async function upload3DAsset(file: File, metadata?: any) {
  const user_id = await uid();
  const path = `${user_id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const up = await supabase.storage.from("3d-assets").upload(path, file);
  if (up.error) throw new Error(up.error.message);

  const file_type = file.name.split(".").pop()?.toLowerCase() || "unknown";
  const format_type = file_type === "glb" || file_type === "gltf" ? "glTF" :
                      file_type === "obj" ? "OBJ" :
                      file_type === "stl" ? "STL" :
                      file_type === "step" || file_type === "stp" ? "STEP" : file_type;

  return unwrap(
    await supabase
      .from("assets_3d")
      .insert({
        user_id,
        name: file.name,
        file_path: path,
        file_type,
        format_type,
        file_size: file.size,
        metadata: metadata || null,
      })
      .select()
      .single(),
  );
}

export async function asset3DUrl(path: string) {
  const { data, error } = await supabase.storage.from("3d-assets").createSignedUrl(path, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function delete3DAsset(asset: Asset3D) {
  await supabase.storage.from("3d-assets").remove([asset.file_path]);
  const { error } = await supabase.from("assets_3d").delete().eq("id", asset.id);
  if (error) throw new Error(error.message);
}
