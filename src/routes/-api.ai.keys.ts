/**
 * API Key Management Routes
 *
 * Server-side endpoints for secure API key storage and retrieval.
 * These routes handle encryption/decryption of API keys.
 */

import { createServerFn } from "@tanstack/react-start";
import { removeModelApiKey as removeKey, storeModelApiKey as storeKey } from "@/lib/ai/encryption";

// Export server functions for client-side calls
export { storeModelKey as storeModelKeyFn, removeModelKey as removeModelKeyFn, checkModelKey as checkModelKeyFn };

/**
 * Store API Key for a Model
 *
 * POST /api/ai/store-key
 *
 * Request body:
 * {
 *   modelId: string;
 *   apiKey: string;
 * }
 */
export const storeModelKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as { modelId?: unknown; apiKey?: unknown };

    if (!body.modelId || typeof body.modelId !== "string") {
      throw new Error("modelId is required");
    }

    if (!body.apiKey || typeof body.apiKey !== "string") {
      throw new Error("apiKey is required");
    }

    // Validate API key format based on common patterns
    const apiKey = body.apiKey.trim();
    if (apiKey.length < 10) {
      throw new Error("Invalid API key format");
    }

    return { modelId: body.modelId, apiKey };
  })
  .handler(async ({ data }) => {
    try {
      await storeKey(data.modelId, data.apiKey);
      return { success: true, message: "API key stored successfully" };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to store API key");
    }
  });

/**
 * Remove API Key from a Model
 *
 * POST /api/ai/remove-key
 *
 * Request body:
 * {
 *   modelId: string;
 * }
 */
export const removeModelKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as { modelId?: unknown };

    if (!body.modelId || typeof body.modelId !== "string") {
      throw new Error("modelId is required");
    }

    return { modelId: body.modelId };
  })
  .handler(async ({ data }) => {
    try {
      await removeKey(data.modelId);
      return { success: true, message: "API key removed successfully" };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to remove API key");
    }
  });

/**
 * Check if a model has a stored API key
 * (Does not return the actual key)
 *
 * POST /api/ai/check-key
 *
 * Request body:
 * {
 *   modelId: string;
 * }
 */
export const checkModelKey = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as { modelId?: unknown };

    if (!body.modelId || typeof body.modelId !== "string") {
      throw new Error("modelId is required");
    }

    return { modelId: body.modelId };
  })
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: model } = await supabaseAdmin
        .from("ai_models")
        .select("has_custom_key")
        .eq("id", data.modelId)
        .single();

      if (!model) {
        return { hasKey: false };
      }

      return { hasKey: !!model.has_custom_key };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to check API key");
    }
  });
