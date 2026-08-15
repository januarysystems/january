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
    puter: any;
  }
}

export interface PuterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

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
   * @param messages - Conversation messages
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

    // Default options
    const model = options.model || 'gpt-5.4-nano';

    console.log('[PuterService] Generating response with model:', model);
    console.log('[PuterService] Messages count:', messages.length);

    try {
      // Build conversation string for Puter
      // Puter.ai.chat() takes the latest message and optional context
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      // Build conversation context from previous messages
      const conversationContext = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role}: ${m.content}`)
        .join('\n\n');

      console.log('[PuterService] User message:', lastMessage.content.substring(0, 100));

      // Call Puter AI with simplified options
      let response: string | undefined;
      try {
        // Try with model parameter first
        response = await window.puter.ai.chat(lastMessage.content, {
          model: model
        });
      } catch (modelError) {
        console.warn('[PuterService] Model parameter failed, trying without:', modelError);
        // Fallback: try without model parameter
        response = await window.puter.ai.chat(lastMessage.content);
      }

      console.log('[PuterService] Response received, length:', response?.length || 0);
      console.log('[PuterService] Response preview:', response?.substring(0, 100));

      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response from Puter AI');
      }

      return {
        content: response,
        model: model,
        success: true
      };
    } catch (error) {
      console.error('[PuterService] Generation error:', error);
      throw error;
    }
  }

  /**
   * Simple chat without full message history
   */
  async chat(message: string, model: string = 'gpt-5.4-nano'): Promise<string> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (!this.isReady()) {
      throw new Error('Puter AI is not available');
    }

    console.log('[PuterService] Simple chat:', message.substring(0, 100));

    const response = await window.puter.ai.chat(message, { model });

    return response;
  }
}

// Export singleton instance
export const puterService = new PuterServicePrivate();
