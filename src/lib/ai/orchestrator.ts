/**
 * AI Orchestrator - Central coordinator for AI interactions
 *
 * Architecture:
 * Chat UI -> AI Orchestrator -> Context Manager -> Model Adapter -> AI Provider -> Stream Response -> Chat UI
 *
 * Responsibilities:
 * 1. Receive user request
 * 2. Identify current conversation
 * 3. Identify active project
 * 4. Retrieve relevant memory
 * 5. Prepare context
 * 6. Select configured AI model
 * 7. Call AI provider
 * 8. Stream response
 * 9. Persist response
 * 10. Update JANUARY Core state
 * 11. Prepare for future tool execution
 */

import type { AIMessage, AIStreamChunk } from "./providers";

export interface OrchestratorContext {
  conversation: {
    id: string | null;
    messages: AIMessage[];
    title?: string;
  };
  project?: {
    id: string;
    name: string;
    description?: string;
    category?: string;
  };
  memories: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    importance: number;
  }>;
  userSettings: {
    language: string;
    voiceEnabled: boolean;
    theme: string;
  };
}

export interface OrchestratorOptions {
  modelId?: string;
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  enableMemory?: boolean;
  enableProjectContext?: boolean;
  stream?: boolean; // Added stream option
}

export interface OrchestratorStreamEvent {
  type: "start" | "thinking" | "content" | "tool_call" | "done" | "error";
  data?: string;
  error?: string;
  coreState?: "idle" | "listening" | "thinking" | "speaking" | "success" | "error";
}

export class AIOrchestrator {
  private controller: AbortController | null = null;
  private currentEventCallback: ((event: OrchestratorStreamEvent) => void) | null = null;

  /**
   * Main entry point for AI requests
   */
  async *generate(
    userMessage: string,
    context: OrchestratorContext,
    options: OrchestratorOptions = {}
  ): AsyncGenerator<OrchestratorStreamEvent> {
    console.log("[ORCHESTRATOR] Starting AI generation for:", userMessage.substring(0, 50));
    this.controller = new AbortController();

    try {
      // Step 1: Notify start
      console.log("[ORCHESTRATOR] Step 1: Notifying start");
      yield { type: "start", coreState: "thinking" };

      // Step 2: Build messages with context
      console.log("[ORCHESTRATOR] Step 2: Building messages");
      const messages = this.buildMessages(userMessage, context, options);
      console.log("[ORCHESTRATOR] Messages built, count:", messages.length);

      // Step 3: Get AI provider configuration
      console.log("[ORCHESTRATOR] Step 3: Resolving provider");
      const providerConfig = await this.resolveProvider(options);
      console.log("[ORCHESTRATOR] Provider config:", providerConfig);

      if (!providerConfig) {
        console.error("[ORCHESTRATOR] No provider configured");
        yield {
          type: "error",
          error: "No AI provider configured. Please select and configure an AI model in Settings.",
          coreState: "error",
        };
        return;
      }

      // Step 4: Call AI through server endpoint
      console.log("[ORCHESTRATOR] Step 4: Calling AI service");
      console.log("[ORCHESTRATOR] Message count for AI:", messages.length);
      console.log("[ORCHESTRATOR] First message role:", messages[0]?.role);
      console.log("[ORCHESTRATOR] Last message role:", messages[messages.length - 1]?.role);
      console.log("[ORCHESTRATOR] Last message content preview:", messages[messages.length - 1]?.content?.substring(0, 50));

      yield* this.callAIService(messages, providerConfig, options, context);

      // Step 5: Complete
      console.log("[ORCHESTRATOR] Step 5: Generation complete");
      yield { type: "done", coreState: "idle" };
    } catch (error) {
      console.error("[ORCHESTRATOR] Generation error:", error);
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
        coreState: "error",
      };
    }
  }

  /**
   * Stop current generation
   */
  stop(): void {
    this.controller?.abort();
    this.controller = null;
  }

  /**
   * Build messages with context from conversation, memory, and project
   */
  private buildMessages(
    userMessage: string,
    context: OrchestratorContext,
    options: OrchestratorOptions
  ): AIMessage[] {
    const messages: AIMessage[] = [];

    // 1. System prompt
    messages.push({
      role: "system",
      content: this.buildSystemPrompt(context, options),
    });

    // 2. Recent conversation history (last 10 messages for context)
    const recentMessages = context.conversation.messages
      .slice(-10)
      .filter((m) => m.role !== "system");

    messages.push(...recentMessages);

    // 3. Current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    return messages;
  }

  /**
   * Build system prompt with JANUARY personality and context
   */
  private buildSystemPrompt(context: OrchestratorContext, options: OrchestratorOptions): string {
    const parts: string[] = [];

    // Core identity
    parts.push(`You are JANUARY, a professional AI engineering assistant.`);

    // Personality traits
    parts.push(`
You are:
- Professional and technically competent
- Clear and context-aware
- Helpful and engineering-oriented
- Honest about uncertainty
- Never fabricate results
- Never claim to have performed actions you did not perform

You must distinguish between:
1. What you know
2. What you infer
3. What you actually executed
4. What you cannot currently do

You should refer to yourself as "JANUARY" when appropriate.
`);

    // Language preference
    const userLang = context.userSettings.language || "en";
    if (userLang !== "en") {
      parts.push(`
The user's preferred language is ${userLang.toUpperCase()}.
You should respond in ${userLang.toUpperCase()} when the user communicates in that language.
`);
    }

    // Project context
    if (options.enableProjectContext && context.project) {
      parts.push(`
CURRENT PROJECT:
- Name: ${context.project.name}
- Description: ${context.project.description || "No description"}
- Category: ${context.project.category || "General"}

The user is currently working within this project context. Consider this when responding to engineering questions.
`);
    }

    // Memory context (selective - only high-importance memories)
    if (options.enableMemory && context.memories.length > 0) {
      const importantMemories = context.memories
        .filter((m) => m.importance >= 4)
        .slice(-5); // Last 5 important memories

      if (importantMemories.length > 0) {
        parts.push(`
RELEVANT MEMORIES:
${importantMemories.map((m) => `- ${m.title}: ${m.content}`).join("\n")}

Consider these when the user asks about preferences or project details.
`);
      }
    }

    // Capabilities and limitations
    parts.push(`
CAPABILITIES:
- Answer technical questions
- Generate code (with syntax highlighting)
- Explain engineering concepts
- Help with debugging
- Provide design guidance
- Work with project context

LIMITATIONS (Phase 2):
- You cannot execute code directly
- You cannot perform web searches (unless specifically requested and available)
- You cannot control IoT devices directly
- You cannot run simulations
- You cannot access the user's camera or files unless provided
- Always be clear about what you can and cannot do

When uncertain, say so clearly. Never make up capabilities.
`);

    return parts.join("\n");
  }

  /**
   * Resolve which AI provider to use
   */
  private async resolveProvider(options: OrchestratorOptions): Promise<{
    provider: string;
    model: string;
  }> {
    console.log("[ORCHESTRATOR] Resolving provider with options:", options);

    try {
      // Try to get active model from registry
      const { listAIModels } = await import("../api");
      const models = await listAIModels();
      console.log("[ORCHESTRATOR] Available models:", models?.length || 0);

      // Safety check: ensure models is an array
      if (models && Array.isArray(models) && models.length > 0) {
        const activeModel = models.find((m) => m.status === "active");
        console.log("[ORCHESTRATOR] Active model found:", !!activeModel);

        if (activeModel && activeModel.provider && activeModel.model_name) {
          console.log("[ORCHESTRATOR] Using active model:", activeModel.provider, activeModel.model_name);
          return {
            provider: activeModel.provider,
            model: activeModel.model_name,
          };
        } else if (activeModel) {
          console.warn("[ORCHESTRATOR] Active model exists but missing provider or model_name:", activeModel);
        }
      }
    } catch (error) {
      console.warn("[ORCHESTRATOR] Failed to get active model from registry:", error);
    }

    // No fallback - should not reach here in new architecture
    console.error("[ORCHESTRATOR] No AI provider configured");
    throw new Error("No AI provider configured. Please use the JANUARY AI service.");
  }

  /**
   * Call AI service through server endpoint
   */
  private async *callAIService(
    messages: AIMessage[],
    config: { provider: string; model: string },
    options: OrchestratorOptions,
    context: OrchestratorContext
  ): AsyncGenerator<OrchestratorStreamEvent> {
    try {
      console.log("[ORCHESTRATOR-AI] Calling AI service:", { provider: config.provider, model: config.model });
      console.log("[ORCHESTRATOR-AI] Messages count:", messages.length);

      // Import server function from TanStack Start route
      console.log("[ORCHESTRATOR-AI] Importing server function...");
      const { aiChat } = await import("@/routes/-api.ai.chat");
      console.log("[ORCHESTRATOR-AI] Server function imported");

      // Call the AI chat server function
      const streamMode = options.stream ?? true;
      console.log("[ORCHESTRATOR-AI] Calling server function, stream mode:", streamMode);
      const response = await aiChat({
        provider: config.provider,
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 4096,
        stream: streamMode,
        context: {
          projectId: context.project?.id,
          conversationId: context.conversation.id,
          language: context.userSettings.language,
        },
      });

      console.log("[ORCHESTRATOR-AI] Response received");
      console.log("[ORCHESTRATOR-AI] Response type:", response?.constructor.name);

      // Handle non-streaming response (plain object with {error, content})
      if (!streamMode) {
        console.log("[ORCHESTRATOR-AI] Processing non-streaming response");
        if (!response || typeof response !== 'object') {
          console.error("[ORCHESTRATOR-AI] Invalid non-streaming response:", response);
          throw new Error("Invalid response from AI service");
        }

        const result = response as { error: string | null; content: string };
        console.log("[ORCHESTRATOR-AI] Non-streaming result:", { hasError: !!result.error, contentLength: result.content?.length });

        if (result.error) {
          yield { type: "error", error: result.error };
          return;
        }

        if (result.content) {
          yield { type: "content", data: result.content };
        }

        yield { type: "done" };
        return;
      }

      // Handle streaming response (Response object with SSE stream)
      console.log("[ORCHESTRATOR-AI] Processing streaming response");

      // Check if response is a valid Response object
      if (!response || typeof response !== 'object') {
        console.error("[ORCHESTRATOR-AI] Invalid response:", response);
        throw new Error("Invalid response from AI service");
      }

      // The response should be a Response object with a body
      if (!(response instanceof Response)) {
        console.error("[ORCHESTRATOR-AI] Response is not a Response object:", typeof response);
        throw new Error("AI service did not return a valid Response");
      }

      console.log("[ORCHESTRATOR-AI] Response status:", response.status);
      console.log("[ORCHESTRATOR-AI] Has body:", !!response.body);

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let chunkCount = 0;

      console.log("[ORCHESTRATOR-AI] Starting to read stream...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[ORCHESTRATOR-AI] Stream reading complete, chunks:", chunkCount);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            console.log("[Orchestrator] Stream complete, chunks received:", chunkCount);
            yield { type: "done" };
            return;
          }

          try {
            const chunk: AIStreamChunk = JSON.parse(data);
            chunkCount++;

            if (chunk.type === "text" && chunk.content) {
              console.log("[Orchestrator] Content chunk:", chunk.content.substring(0, 50));
              yield { type: "content", data: chunk.content };
            } else if (chunk.type === "error") {
              console.error("[Orchestrator] Error chunk:", chunk.error);
              yield { type: "error", error: chunk.error };
            }
          } catch (e) {
            console.warn("[Orchestrator] Failed to parse SSE data:", e, "Data:", data);
          }
        }
      }
    } catch (error) {
      console.error("[Orchestrator] AI service error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        yield { type: "error", error: "Generation stopped by user" };
      } else {
        yield {
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  }
}

// Singleton instance
export const orchestrator = new AIOrchestrator();
