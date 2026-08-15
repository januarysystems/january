/**
 * OpenAI Provider Implementation
 *
 * Server-side only - never expose API keys to client
 */

import type { AIProvider, AICompletionOptions, AIMessage, AIStreamChunk } from "./providers";

interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly name = "OpenAI";

  private baseURL = "https://api.openai.com/v1";
  private apiKey: string | null = null;

  constructor(customApiKey?: string, customBaseURL?: string) {
    // Only load on server-side
    if (typeof process !== "undefined" && process.env) {
      this.apiKey = customApiKey || process.env.OPENAI_API_KEY || null;
      this.baseURL = customBaseURL || process.env.OPENAI_BASE_URL || this.baseURL;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getModels(): string[] {
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "o1-mini",
      "o1-preview",
    ];
  }

  async *complete(
    messages: AIMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const openAIMessages: OpenAIMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
      tool_calls: m.toolCalls?.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
      tool_call_id: m.toolCallId,
    }));

    if (options.stream) {
      yield* this.streamChat(openAIMessages, options);
    } else {
      yield* this.nonStreamChat(openAIMessages, options);
    }
  }

  private async *streamChat(
    messages: OpenAIMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096,
          stream: true,
          tools: options.tools,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || "OpenAI API error");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            yield { type: "done" };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.content) {
              yield { type: "text", content: delta.content };
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                yield {
                  type: "tool_call",
                  toolCall: {
                    id: tc.id,
                    type: "function",
                    function: {
                      name: tc.function?.name || "",
                      arguments: tc.function?.arguments || "",
                    },
                  },
                };
              }
            }
          } catch (e) {
            // Skip invalid JSON
            console.warn("Failed to parse SSE data:", e);
          }
        }
      }
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async *nonStreamChat(
    messages: OpenAIMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096,
          stream: false,
          tools: options.tools,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || "OpenAI API error");
      }

      const data: OpenAIResponse = await response.json();

      if (data.error) {
        yield { type: "error", error: data.error.message };
        return;
      }

      const choice = data.choices[0];
      if (choice?.message?.content) {
        yield { type: "text", content: choice.message.content };
      }

      if (choice?.message?.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          yield {
            type: "tool_call",
            toolCall: {
              id: tc.id,
              type: "function",
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments,
              },
            },
          };
        }
      }

      yield { type: "done" };
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
