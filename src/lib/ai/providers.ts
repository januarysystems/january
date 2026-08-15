/**
 * AI Provider Abstraction Layer
 *
 * This provides a unified interface for multiple AI providers:
 * - OpenAI
 * - Anthropic (Claude)
 * - Google Gemini
 * - OpenRouter
 * - Local models (future)
 * - Ollama (future)
 */

export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIStreamChunk {
  type: "text" | "tool_call" | "error" | "done";
  content?: string;
  toolCall?: ToolCall;
  error?: string;
}

export interface AICompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: ToolDefinition[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
  };
}

export interface AIProvider {
  /**
   * Unique provider identifier
   */
  readonly id: string;

  /**
   * Human-readable provider name
   */
  readonly name: string;

  /**
   * Generate a completion with optional streaming
   */
  complete(
    messages: AIMessage[],
    options: AICompletionOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown>;

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): Promise<boolean> | boolean;

  /**
   * Get available models for this provider
   */
  getModels?(): string[];
}

/**
 * Provider registry - allows dynamic provider registration
 */
class ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  list(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  get configured(): AIProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isConfigured());
  }
}

export const providerRegistry = new ProviderRegistry();

/**
 * Base AI error class
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public provider?: string
  ) {
    super(message);
    this.name = "AIError";
  }
}

/**
 * Specific error types
 */
export class AIConfigError extends AIError {
  constructor(message: string, provider?: string) {
    super(message, "CONFIG_ERROR", provider);
    this.name = "AIConfigError";
  }
}

export class AIAPIError extends AIError {
  constructor(message: string, provider?: string) {
    super(message, "API_ERROR", provider);
    this.name = "AIAPIError";
  }
}

export class AIRateLimitError extends AIError {
  constructor(message: string, provider?: string) {
    super(message, "RATE_LIMIT", provider);
    this.name = "AIRateLimitError";
  }
}

export class AIInvalidRequestError extends AIError {
  constructor(message: string, provider?: string) {
    super(message, "INVALID_REQUEST", provider);
    this.name = "AIInvalidRequestError";
  }
}
