/**
 * Ollama AI Service for JANUARY
 *
 * Local AI service using Portable Ollama for text generation.
 * This service handles all Ollama AI interactions.
 *
 * Portable Ollama provides local AI inference without requiring:
 * - System-level installation
 * - API keys or cloud services
 * - External dependencies
 *
 * Everything is bundled within the JANUARY application.
 */

import { portableOllamaManager } from '../services/portable-ollama';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaResponse {
  content: string;
  model: string;
  success: boolean;
  error?: string;
}

export interface OllamaServiceOptions {
  model?: string;
  temperature?: number;
  stream?: boolean;
}

export interface OllamaHealthStatus {
  available: boolean;
  running: boolean;
  modelInstalled: boolean;
  currentModel: string;
  error?: string;
}

export interface OllamaModelInfo {
  name: string;
  size?: number;
  modified?: string;
}

/**
 * Ollama AI Service - Singleton
 */
class OllamaServicePrivate {
  private isInitialized = false;
  private baseUrl: string;
  private defaultModel: string;
  private availableModels: string[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Read from environment variables or use defaults
    this.baseUrl = this.getBaseUrlFromEnvironment();
    this.defaultModel = this.getModel();
  }

  /**
   * Get Ollama base URL from environment or default
   */
  private getBaseUrlFromEnvironment(): string {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    }
    return 'http://127.0.0.1:11434';
  }

  /**
   * Get default model from environment or default
   */
  private getModel(): string {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.OLLAMA_MODEL || 'qwen2.5-coder:32b';
    }
    return 'qwen2.5-coder:32b';
  }

  /**
   * Initialize the service
   * Now handles portable Ollama startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('[OllamaService] Initializing Ollama Service...');
    console.log('[OllamaService] Base URL:', this.baseUrl);
    console.log('[OllamaService] Default model:', this.defaultModel);

    // Check if portable Ollama is installed
    const isInstalled = portableOllamaManager.isInstalled();
    console.log('[OllamaService] Portable Ollama installed:', isInstalled);

    // Start portable Ollama if not running
    if (isInstalled) {
      const status = await portableOllamaManager.start();
      console.log('[OllamaService] Portable Ollama started:', status.running);

      if (status.running) {
        // Update base URL to use portable Ollama
        this.baseUrl = 'http://127.0.0.1:11434';
      }
    }

    // Check Ollama availability
    const health = await this.checkHealth();

    if (!health.running) {
      console.warn('[OllamaService] Ollama is not running:', health.error);
    } else if (!health.modelInstalled) {
      console.warn('[OllamaService] Model not installed:', this.defaultModel);
    }

    this.isInitialized = true;
    console.log('[OllamaService] Ollama Service initialized');
  }

  /**
   * Check Ollama health and model availability
   */
  async checkHealth(): Promise<OllamaHealthStatus> {
    const status: OllamaHealthStatus = {
      available: false,
      running: false,
      modelInstalled: false,
      currentModel: this.defaultModel,
    };

    try {
      // Check if Ollama is running by listing models
      const models = await this.listModels();
      this.availableModels = models.map(m => m.name);

      status.running = true;
      status.available = true;
      status.modelInstalled = this.availableModels.includes(this.defaultModel);

      console.log('[OllamaService] Health check - Running:', status.running, 'Model installed:', status.modelInstalled);
    } catch (error) {
      status.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[OllamaService] Health check failed:', status.error);
    }

    return status;
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('[OllamaService] Failed to list models:', error);
      throw new Error('Cannot connect to Ollama. Make sure Ollama is running.');
    }
  }

  /**
   * Pull a model from Ollama
   * Note: This is a long-running operation and should be done server-side
   */
  async pullModel(model: string): Promise<void> {
    console.log('[OllamaService] Pulling model:', model);

    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: model,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status}`);
      }

      console.log('[OllamaService] Model pulled successfully:', model);
    } catch (error) {
      console.error('[OllamaService] Failed to pull model:', error);
      throw error;
    }
  }

  /**
   * Generate AI response using Ollama
   *
   * @param messages - Conversation messages including system prompt
   * @param options - Generation options
   * @returns AI response
   */
  async generateResponse(
    messages: OllamaMessage[],
    options: OllamaServiceOptions = {}
  ): Promise<OllamaResponse> {
    // Initialize if not already
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Use provided model or default
    const model = options.model || this.defaultModel;

    console.log('[OllamaService] Generating response with model:', model);
    console.log('[OllamaService] Total messages:', messages.length);
    console.log('[OllamaService] Message roles:', messages.map(m => m.role).join(', '));

    try {
      // Validate messages array
      if (!messages || messages.length === 0) {
        throw new Error('No messages provided to Ollama');
      }

      // Check if Ollama is running
      const health = await this.checkHealth();
      if (!health.running) {
        throw new Error('Ollama is not running. Please start Ollama and try again.');
      }

      // Check if model is installed
      if (!health.modelInstalled) {
        throw new Error(`Model "${model}" is not installed. Run: ollama pull ${model}`);
      }

      // Prepare Ollama chat request
      const requestBody = {
        model: model,
        messages: messages,
        stream: options.stream ?? false,
      };

      console.log('[OllamaService] Calling Ollama API...');

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('[OllamaService] Response received from Ollama');

      // Extract content from Ollama's response format
      // Ollama returns: { message: { role: "assistant", content: "..." }, done: true }
      const content = data?.message?.content;

      if (!content || typeof content !== 'string') {
        console.error('[OllamaService] Invalid response structure:', data);
        throw new Error('Ollama returned an empty or invalid response');
      }

      console.log('[OllamaService] Response content length:', content.length);
      console.log('[OllamaService] Response preview:', content.substring(0, 100));

      return {
        content: content,
        model: model,
        success: true,
      };
    } catch (error) {
      console.error('[OllamaService] Generation error:', error);

      // Provide specific error messages
      if (error instanceof Error) {
        return {
          content: '',
          model: model,
          success: false,
          error: error.message,
        };
      }

      return {
        content: '',
        model: model,
        success: false,
        error: 'Ollama AI request failed',
      };
    }
  }

  /**
   * Simple chat without full message history
   * Note: This method does not include the system prompt or conversation history
   * For proper JANUARY responses, use generateResponse() instead
   */
  async chat(message: string, model: string = this.defaultModel): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('[OllamaService] Simple chat:', message.substring(0, 100));

    const response = await this.generateResponse(
      [{ role: 'user', content: message }],
      { model }
    );

    if (!response.success || !response.content) {
      throw new Error(response.error || 'Failed to get response from Ollama');
    }

    return response.content;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service state
   */
  getState() {
    return {
      initialized: this.isInitialized,
      baseUrl: this.baseUrl,
      defaultModel: this.defaultModel,
      availableModels: this.availableModels,
    };
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);

    console.log('[OllamaService] Started health checks every', intervalMs, 'ms');
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('[OllamaService] Stopped health checks');
    }
  }
}

// Export singleton instance
export const ollamaService = new OllamaServicePrivate();
