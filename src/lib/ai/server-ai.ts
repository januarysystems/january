/**
 * Server-side AI Service
 *
 * This file runs server-side and contains the actual AI provider logic.
 * It is imported by API routes and should never be bundled to the client.
 *
 * NEVER import this file in client-side components.
 */

import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { providerRegistry } from "./providers";
import type { AICompletionOptions, AIMessage, AIStreamChunk } from "./providers";
import { getModelApiKey } from "./encryption";
import { loadServerEnv } from "./server-config";
import { OpenAIProvider as OpenAIProviderImpl } from "./openai-provider";
import { AnthropicProvider as AnthropicProviderImpl } from "./anthropic-provider";

// Load environment variables
console.log("[SERVER-AI] Initializing server AI module");
loadServerEnv();

// Register providers (server-side only)
console.log("[SERVER-AI] process type:", typeof process);
console.log("[SERVER-AI] process.env exists:", typeof process !== "undefined" && !!process.env);
if (typeof process !== "undefined" && process.env) {
  console.log("[SERVER-AI] Running in server environment, registering providers");

  providerRegistry.register(new OpenAIProvider());
  providerRegistry.register(new AnthropicProvider());

  console.log("[SERVER-AI] Providers registered, total:", providerRegistry.list().length);
} else {
  console.warn("[SERVER-AI] Not running in server environment, skipping provider registration");
}

/**
 * Server-side AI chat handler
 *
 * This function is called by API routes and should never be exposed to the client.
 */
export async function* handleAIChatRequest(request: {
  provider: string;
  model: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  context?: {
    projectId?: string;
    conversationId?: string;
    language?: string;
  };
}): AsyncGenerator<AIStreamChunk> {
  console.log("[SERVER-AI-HANDLER] handleAIChatRequest called");
  console.log("[SERVER-AI-HANDLER] Provider:", request.provider);
  console.log("[SERVER-AI-HANDLER] Model:", request.model);
  console.log("[SERVER-AI-HANDLER] Messages count:", request.messages?.length);
  console.log("[SERVER-AI-HANDLER] Stream:", request.stream);

  const { provider, model, messages, temperature, maxTokens, stream = true, context } = request;

  // Get the provider
  console.log("[SERVER-AI-HANDLER] Getting provider from registry...");
  const aiProvider = providerRegistry.get(provider);
  console.log("[SERVER-AI-HANDLER] Provider found:", !!aiProvider);

  if (!aiProvider) {
    console.error("[SERVER-AI-HANDLER] Provider not found:", provider);
    const availableProviders = providerRegistry.list().map((p) => p.id);
    console.error("[SERVER-AI-HANDLER] Available providers:", availableProviders);
    yield {
      type: "error",
      error: `Provider "${provider}" not found. Available providers: ${availableProviders.join(", ")}`,
    };
    return;
  }

  // Check if there's a custom API key for this model (from conversation context)
  let customApiKey: string | null = null;
  if (context?.conversationId) {
    try {
      // Try to get the active model for this conversation
      const { listAIModels } = await import("../api");
      const models = await listAIModels();
      const activeModel = models.find((m) => m.status === "active" && m.model_name === model);

      if (activeModel && activeModel.has_custom_key) {
        customApiKey = await getModelApiKey(activeModel.id);
      }
    } catch (error) {
      console.warn("Failed to get custom API key:", error);
    }
  }

  // Create provider instance with custom key if available
  let providerInstance = aiProvider;
  if (customApiKey) {
    // Create a new provider instance with the custom API key
    if (provider === "openai") {
      providerInstance = new OpenAIProviderImpl(customApiKey);
    } else if (provider === "anthropic") {
      providerInstance = new AnthropicProviderImpl(customApiKey);
    }
  }

  // Check if configured
  const isConfigured = await providerInstance.isConfigured();
  if (!isConfigured) {
    console.error(`[Server] Provider "${provider}" is not configured`);
    yield {
      type: "error",
      error: `Provider "${provider}" is not configured. Please set up the ${provider.toUpperCase()}_API_KEY environment variable or add a custom API key in the AI Models page.`,
    };
    return;
  }

  // Validate messages
  if (!messages || messages.length === 0) {
    yield { type: "error", error: "No messages provided" };
    return;
  }

  const options: AICompletionOptions = {
    model,
    temperature,
    maxTokens,
    stream,
  };

  try {
    // Delegate to the provider
    yield* providerInstance.complete(messages, options);
  } catch (error) {
    yield {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get list of available providers and their status
 */
export function getProvidersStatus() {
  return providerRegistry.list().map((provider) => ({
    id: provider.id,
    name: provider.name,
    configured: provider.isConfigured(),
    models: provider.getModels?.() || [],
  }));
}

/**
 * Validate if a provider/model combination is available
 */
export function validateModelConfig(providerId: string, model: string): {
  valid: boolean;
  error?: string;
} {
  const provider = providerRegistry.get(providerId);

  if (!provider) {
    return {
      valid: false,
      error: `Provider "${providerId}" not found`,
    };
  }

  const models = provider.getModels?.() || [];
  if (models.length > 0 && !models.includes(model)) {
    return {
      valid: false,
      error: `Model "${model}" not found. Available models: ${models.join(", ")}`,
    };
  }

  return { valid: true };
}
