/**
 * Anthropic Claude Provider Implementation
 *
 * Server-side only - never expose API keys to client
 */

import type { AIProvider, AICompletionOptions, AIMessage, AIStreamChunk } from "./providers";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | Array<{
    type: "text" | "image";
    text?: string;
    source?: {
      type: string;
      media_type: string;
      data: string;
    };
  }>;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text?: string;
    delta?: {
      type: string;
      text?: string;
    };
  }>;
  stop_reason: string | null;
  model: string;
  error?: {
    type: string;
    message: string;
  };
}

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  readonly name = "Anthropic";

  private baseURL = "https://api.anthropic.com/v1/messages";
  private apiKey: string | null = null;

  constructor(customApiKey?: string) {
    // Only load on server-side
    if (typeof process !== "undefined" && process.env) {
      this.apiKey = customApiKey || process.env.ANTHROPIC_API_KEY || null;
      if (process.env.ANTHROPIC_BASE_URL) {
        this.baseURL = process.env.ANTHROPIC_BASE_URL;
      }
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getModels(): string[] {
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ];
  }

  async *complete(
    messages: AIMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    if (!this.apiKey) {
      throw new Error("Anthropic API key is not configured");
    }

    // Convert messages to Anthropic format
    const anthropicMessages = this.toAnthropicMessages(messages);

    if (options.stream) {
      yield* this.streamMessages(anthropicMessages, options);
    } else {
      yield* this.nonStreamMessages(anthropicMessages, options);
    }
  }

  private toAnthropicMessages(messages: AIMessage[]): AnthropicMessage[] {
    const result: AnthropicMessage[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        // System messages are passed separately in Anthropic
        continue;
      }

      if (msg.role === "tool") {
        // Tool results - append to last assistant message or create user message
        continue;
      }

      if (msg.role === "assistant" && msg.toolCalls) {
        // Assistant with tool calls - handle in streaming
        continue;
      }

      result.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }

    return result;
  }

  private getSystemMessage(messages: AIMessage[]): string | undefined {
    const systemMsg = messages.find((m) => m.role === "system");
    return systemMsg?.content;
  }

  private async *streamMessages(
    messages: AnthropicMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk> {
    try {
      const system = this.getSystemMessage(messages);

      const body = {
        model: options.model,
        messages: messages.filter((m) => m.role !== "system"),
        system,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      };

      const response = await fetch(this.baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || "Anthropic API error");
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
            const parsed: AnthropicResponse = JSON.parse(data);

            if (parsed.error) {
              yield { type: "error", error: parsed.error.message };
              return;
            }

            for (const contentBlock of parsed.content) {
              if (contentBlock.type === "text" && contentBlock.text) {
                yield { type: "text", content: contentBlock.text };
              }
              // Tool calls would be handled here in future
            }
          } catch (e) {
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

  private async *nonStreamMessages(
    messages: AnthropicMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk> {
    try {
      const system = this.getSystemMessage(messages);

      const body = {
        model: options.model,
        messages: messages.filter((m) => m.role !== "system"),
        system,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: false,
      };

      const response = await fetch(this.baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || "Anthropic API error");
      }

      const data: AnthropicResponse = await response.json();

      if (data.error) {
        yield { type: "error", error: data.error.message };
        return;
      }

      for (const contentBlock of data.content) {
        if (contentBlock.type === "text" && contentBlock.text) {
          yield { type: "text", content: contentBlock.text };
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
