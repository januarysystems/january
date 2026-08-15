/**
 * AI Chat API Route
 *
 * Server-side endpoint for AI chat interactions.
 * This route handles streaming responses from AI providers.
 *
 * Environment variables required:
 * - OPENAI_API_KEY (for OpenAI provider)
 * - ANTHROPIC_API_KEY (for Anthropic provider)
 */

import { createServerFn } from "@tanstack/react-start";
import { handleAIChatRequest, getProvidersStatus, validateModelConfig } from "@/lib/ai/server-ai";
import type { AIMessage, AIStreamChunk } from "@/lib/ai/providers";

// Export server functions for client-side calls
export { aiChat as aiChatFn, getProviders as getProvidersFn, validateModel as validateModelFn };

/**
 * AI Chat Streaming Endpoint
 *
 * POST /api/ai/chat
 *
 * Request body:
 * {
 *   provider: string;        // "openai" | "anthropic"
 *   model: string;          // e.g., "gpt-4o-mini" | "claude-3-5-sonnet-20241022"
 *   messages: AIMessage[];
 *   temperature?: number;
 *   maxTokens?: number;
 *   stream?: boolean;
 * }
 *
 * Returns: Server-Sent Event stream with AIStreamChunk responses
 */
export const aiChat = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as {
      provider?: string;
      model?: string;
      messages?: unknown;
      temperature?: unknown;
      maxTokens?: unknown;
      stream?: unknown;
    };

    // Validate provider
    if (!body.provider || typeof body.provider !== "string") {
      throw new Error("Provider is required and must be a string");
    }

    // Validate model
    if (!body.model || typeof body.model !== "string") {
      throw new Error("Model is required and must be a string");
    }

    // Validate messages
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error("Messages is required and must be an array");
    }

    // Validate message format
    const messages = body.messages as AIMessage[];
    for (const msg of messages) {
      if (!msg.role || !["system", "user", "assistant", "tool"].includes(msg.role)) {
        throw new Error(`Invalid message role: ${msg.role}`);
      }
      if (typeof msg.content !== "string") {
        throw new Error("Message content must be a string");
      }
    }

    return {
      provider: body.provider as string,
      model: body.model as string,
      messages: messages as AIMessage[],
      temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
      maxTokens: typeof body.maxTokens === "number" ? body.maxTokens : 4096,
      stream: typeof body.stream === "boolean" ? body.stream : true,
    };
  })
  .handler(async ({ data }) => {
    console.log("[AI-CHAT-SERVER] Handler called, stream:", data.stream);

    // Handle non-streaming mode
    if (!data.stream) {
      console.log("[AI-CHAT-SERVER] Non-streaming mode, collecting full response");
      let fullContent = "";
      let error = null;

      try {
        // Call the AI service and collect all chunks
        const generator = handleAIChatRequest(data);

        for await (const chunk of generator) {
          if (chunk.type === "text" && chunk.data) {
            fullContent += chunk.data;
          } else if (chunk.type === "error") {
            error = chunk.error;
            break;
          } else if (chunk.type === "done") {
            break;
          }
        }

        if (error) {
          console.error("[AI-CHAT-SERVER] Error in non-streaming mode:", error);
          return { error, content: "" };
        }

        console.log("[AI-CHAT-SERVER] Non-streaming response complete, length:", fullContent.length);
        return { error: null, content: fullContent };
      } catch (err) {
        console.error("[AI-CHAT-SERVER] Exception in non-streaming mode:", err);
        return { error: err instanceof Error ? err.message : "Unknown error", content: "" };
      }
    }

    // Create a streaming response
    console.log("[AI-CHAT-SERVER] Streaming mode, setting up SSE stream");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call the AI service
          const generator = handleAIChatRequest(data);

          // Stream each chunk
          for await (const chunk of generator) {
            const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(sseData));

            // End stream on done or error
            if (chunk.type === "done" || chunk.type === "error") {
              break;
            }
          }

          // Send final done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          // Handle any unexpected errors
          const errorChunk: AIStreamChunk = {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  });

/**
 * Get Providers Status Endpoint
 *
 * GET /api/ai/providers
 *
 * Returns: Array of provider configurations and availability
 */
export const getProviders = createServerFn({ method: "GET" }).handler(() => {
  return getProvidersStatus();
});

/**
 * Validate Model Config Endpoint
 *
 * POST /api/ai/validate
 *
 * Request body:
 * {
 *   providerId: string;
 *   model: string;
 * }
 *
 * Returns: Validation result
 */
export const validateModel = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as { providerId?: unknown; model?: unknown };

    if (!body.providerId || typeof body.providerId !== "string") {
      throw new Error("providerId is required");
    }

    if (!body.model || typeof body.model !== "string") {
      throw new Error("model is required");
    }

    return { providerId: body.providerId, model: body.model };
  })
  .handler(({ data }) => {
    return validateModelConfig(data.providerId, data.model);
  });
