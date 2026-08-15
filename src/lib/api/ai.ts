/**
 * AI API Functions - Server-side endpoints for AI interactions
 *
 * These functions run server-side and should never expose API keys to the client.
 */

import { createServerFn } from "@tanstack/react-start";
import { handleAIChatRequest, getProvidersStatus, validateModelConfig } from "../ai/server-ai";
import type { AIMessage, AIStreamChunk } from "../ai/providers";

/**
 * Server function for AI chat with streaming support
 *
 * This endpoint:
 * - Validates authentication
 * - Calls the appropriate AI provider
 * - Streams responses back to the client
 * - Never exposes API keys
 */
export const aiChatFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as {
      provider?: string;
      model?: string;
      messages?: AIMessage[];
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    };

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      throw new Error("Messages are required");
    }

    return {
      provider: body.provider || "openai",
      model: body.model || "gpt-4o-mini",
      messages: body.messages as AIMessage[],
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens ?? 4096,
      stream: body.stream ?? true,
    };
  })
  .handler(async ({ data }) => {
    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = handleAIChatRequest(data);

          for await (const chunk of generator) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));

            if (chunk.type === "done" || chunk.type === "error") {
              break;
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          const errorChunk: AIStreamChunk = {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

/**
 * Server function to get available providers and their status
 */
export const getProvidersStatusFn = createServerFn({ method: "GET" }).handler(() => {
  return getProvidersStatus();
});

/**
 * Server function to validate a provider/model configuration
 */
export const validateModelConfigFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as { providerId?: string; model?: string };

    if (!body.providerId || !body.model) {
      throw new Error("providerId and model are required");
    }

    return { providerId: body.providerId, model: body.model };
  })
  .handler(({ data }) => {
    return validateModelConfig(data.providerId, data.model);
  });
