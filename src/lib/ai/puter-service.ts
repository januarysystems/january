/**
 * Puter AI Service for JANUARY
 *
 * Centralized service for Puter.js AI integration.
 * This service handles all Puter AI interactions.
 *
 * Puter.js provides browser-based AI without requiring API keys.
 */

// Puter global type declaration
declare global {
  interface Window {
    puter: PuterGlobal | undefined;
  }
}

/**
 * Puter.js global interface
 */
interface PuterGlobal {
  ai: {
    chat: (messages: PuterChatMessage[], options?: PuterChatOptions) => Promise<PuterChatResponse>;
  };
}

/**
 * Puter chat message format
 */
interface PuterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Puter chat options
 */
interface PuterChatOptions {
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Puter chat response format
 */
interface PuterChatResponse {
  message: {
    content: string;
    role: string;
  };
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PuterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Centralized Puter model identifier
 * Update this in one place to change the model across the entire application
 */
export const PUTER_MODEL = 'openai/gpt-5.4-nano';

export interface PuterResponse {
  content: string;
  model: string;
  success: boolean;
}

export interface PuterServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Puter AI Service - Singleton
 */
class PuterServicePrivate {
  private isInitialized = false;
  private isAvailable = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize Puter.js SDK
   * Loads the Puter.js script from CDN
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.loadPuterSDK();
    await this.initPromise;
    this.initPromise = null;
  }

  /**
   * Load Puter.js SDK from CDN
   */
  private async loadPuterSDK(): Promise<void> {
    try {
      console.log("[PuterService] Loading Puter.js SDK...");

      // Check if already loaded
      if (typeof window !== 'undefined' && window.puter) {
        console.log("[PuterService] Puter.js already loaded");
        this.isAvailable = true;
        this.isInitialized = true;
        return;
      }

      // Load the SDK
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.async = true;
        script.onload = () => {
          console.log("[PuterService] Puter.js loaded successfully");
          resolve();
        };
        script.onerror = () => {
          console.error("[PuterService] Failed to load Puter.js");
          reject(new Error('Failed to load Puter.js SDK'));
        };
        document.head.appendChild(script);
      });

      // Wait for window.puter to be available
      await new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (typeof window !== 'undefined' && window.puter) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);

        // Timeout after 5 seconds - reject the promise
        setTimeout(() => {
          clearInterval(checkInterval);
          console.error("[PuterService] Puter.js loading timeout - SDK not available");
          reject(new Error('Puter.js failed to load within 5 seconds'));
        }, 5000);
      });

      this.isAvailable = typeof window !== 'undefined' && !!window.puter;
      this.isInitialized = true;

      console.log("[PuterService] Initialization complete, available:", this.isAvailable);
    } catch (error) {
      console.error("[PuterService] Initialization error:", error);
      this.isAvailable = false;
      this.isInitialized = true;
      throw error;
    }
  }

  /**
   * Check if Puter is available
   */
  isReady(): boolean {
    return this.isInitialized && this.isAvailable && typeof window !== 'undefined' && !!window.puter;
  }

  /**
   * Get initialization state
   */
  getState(): {
    initialized: boolean;
    available: boolean;
    requiresAuth: boolean;
  } {
    return {
      initialized: this.isInitialized,
      available: this.isAvailable,
      requiresAuth: false // Puter.js v2 doesn't require auth for basic AI
    };
  }

  /**
   * Generate AI response using Puter
   *
   * @param messages - Conversation messages including system prompt
   * @param options - Generation options
   * @returns AI response
   */
  async generateResponse(
    messages: PuterMessage[],
    options: PuterServiceOptions = {}
  ): Promise<PuterResponse> {
    // Initialize if not already
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check availability
    if (!this.isReady()) {
      throw new Error('Puter AI is not available. Please ensure Puter.js is loaded.');
    }

    // Use centralized model identifier
    const model = options.model || PUTER_MODEL;

    console.log('[PuterService] Generating response with model:', model);
    console.log('[PuterService] Total messages:', messages.length);
    console.log('[PuterService] Message roles:', messages.map(m => m.role).join(', '));

    try {
      // Validate messages array
      if (!messages || messages.length === 0) {
        throw new Error('No messages provided to Puter AI');
      }

      // Verify Puter AI is available
      if (!window.puter?.ai?.chat) {
        throw new Error('Puter AI chat function is not available');
      }

      // Prepare Puter chat options
      const chatOptions: PuterChatOptions = {
        model: model,
        stream: false, // Non-streaming for now
      };

      if (options.temperature !== undefined) {
        chatOptions.temperature = options.temperature;
      }
      if (options.maxTokens !== undefined) {
        chatOptions.max_tokens = options.maxTokens;
      }

      console.log('[PuterService] Calling Puter AI with full message array...');

      // Call Puter AI with the complete message array
      // Puter supports the full messages array with system prompt and conversation history
      const result = await window.puter.ai.chat(messages as PuterChatMessage[], chatOptions);

      console.log('[PuterService] Response received from Puter');

      // Extract content from Puter's response format
      // Puter returns: { message: { content: string, role: string }, model?: string, ... }
      const content = result?.message?.content;

      if (!content || typeof content !== 'string') {
        console.error('[PuterService] Invalid response structure:', result);
        throw new Error('Puter returned an empty or invalid response');
      }

      console.log('[PuterService] Response content length:', content.length);
      console.log('[PuterService] Response preview:', content.substring(0, 100));

      return {
        content: content,
        model: model,
        success: true
      };
    } catch (error) {
      console.error('[PuterService] Generation error:', error);

      // Provide specific error messages
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Puter AI request failed');
    }
  }

  /**
   * Simple chat without full message history
   * Note: This method does not include the system prompt or conversation history
   * For proper JANUARY responses, use generateResponse() instead
   */
  async chat(message: string, model: string = PUTER_MODEL): Promise<string> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (!this.isReady()) {
      throw new Error('Puter AI is not available');
    }

    if (!window.puter?.ai?.chat) {
      throw new Error('Puter AI chat function is not available');
    }

    console.log('[PuterService] Simple chat:', message.substring(0, 100));

    const result = await window.puter.ai.chat([{ role: 'user', content: message }], { model });

    const content = result?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Puter returned an invalid response');
    }

    return content;
  }
}

// Export singleton instance
export const puterService = new PuterServicePrivate();
