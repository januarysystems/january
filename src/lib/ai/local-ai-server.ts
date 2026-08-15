/**
 * Local AI Server Functions
 *
 * Server-side endpoints for local AI interactions using Ollama.
 * These functions run server-side and communicate with the local Ollama instance.
 */

import { createServerFn } from "@tanstack/react-start";
import { ollamaService } from "./ollama-service";
import type { OllamaMessage } from "./ollama-service";

/**
 * Server function for local AI chat with Ollama
 *
 * This endpoint:
 * - Validates the request
 * - Calls the local Ollama service
 * - Returns AI response
 * - Never exposes internal configuration
 */
export const localAIChatFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as {
      messages?: OllamaMessage[];
      model?: string;
      temperature?: number;
    };

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      throw new Error("Messages are required");
    }

    return {
      messages: body.messages as OllamaMessage[],
      model: body.model,
      temperature: body.temperature,
    };
  })
  .handler(async ({ data }) => {
    try {
      console.log('[LocalAI] Server: Processing chat request');
      console.log('[LocalAI] Message count:', data.messages.length);

      // Initialize Ollama service if needed
      await ollamaService.initialize();

      // Check Ollama health
      const health = await ollamaService.checkHealth();
      if (!health.running) {
        return {
          success: false,
          error: 'Ollama is not running. Please start Ollama and try again.',
          content: '',
        };
      }

      if (!health.modelInstalled) {
        return {
          success: false,
          error: `Model "${health.currentModel}" is not installed. Run: ollama pull ${health.currentModel}`,
          content: '',
        };
      }

      // Generate response
      const response = await ollamaService.generateResponse(data.messages, {
        model: data.model,
        temperature: data.temperature,
      });

      return response;
    } catch (error) {
      console.error('[LocalAI] Server error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        content: '',
      };
    }
  });

/**
 * Server function to check Ollama health status
 */
export const ollamaHealthFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ollamaService.initialize();
    const health = await ollamaService.checkHealth();
    return health;
  } catch (error) {
    return {
      available: false,
      running: false,
      modelInstalled: false,
      currentModel: ollamaService.getDefaultModel(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

/**
 * Server function to list available Ollama models
 */
export const ollamaModelsFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ollamaService.initialize();
    const models = await ollamaService.listModels();
    return { success: true, models };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list models',
      models: [],
    };
  }
});

/**
 * Server function to pull an Ollama model
 */
export const ollamaPullModelFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as { model?: string };
    if (!body.model) {
      throw new Error("Model name is required");
    }
    return { model: body.model };
  })
  .handler(async ({ data }) => {
    try {
      console.log('[LocalAI] Pulling model:', data.model);
      await ollamaService.initialize();
      await ollamaService.pullModel(data.model);
      return { success: true, message: `Model "${data.model}" pulled successfully` };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pull model',
      };
    }
  });
