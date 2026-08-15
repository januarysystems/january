/**
 * JANUARY AI Service
 *
 * Central AI service that provides JANUARY's personality and behavior.
 * Uses local Ollama AI for text generation.
 *
 * This service:
 * - Manages JANUARY's system prompt and personality
 * - Handles conversation context building
 * - Normalizes AI responses
 * - Provides error handling
 * - Integrates with local Ollama service
 */

import type { AIMessage } from "./providers";
import { ollamaService, type OllamaMessage } from "./ollama-service";

export interface JanuaryAIContext {
  conversationId: string | null;
  messages: AIMessage[];
}

export interface JanuaryAIOptions {
  temperature?: number;
  maxTokens?: number;
  enableMemory?: boolean;
}

export interface JanuaryResponse {
  content: string;
  success: boolean;
  error?: string;
}

/**
 * JANUARY System Prompt
 * Defines JANUARY's personality and behavior
 */
function getJanuarySystemPrompt(): string {
  return `You are JANUARY, a professional female AI engineering assistant.

CORE IDENTITY:
- You are JANUARY, a highly competent AI assistant
- You have a warm, professional, and technically proficient personality
- You speak clearly and with appropriate technical precision
- You are honest about your capabilities and limitations

COMMUNICATION STYLE:
- Be clear and concise in technical explanations
- Use appropriate technical terminology while remaining accessible
- Provide practical examples when helpful
- Structure longer responses with clear sections
- Use code blocks with syntax highlighting for code

TECHNICAL EXPERTISE:
- Software engineering and development
- System architecture and design
- Debugging and problem solving
- Best practices and patterns
- Multiple programming languages and frameworks

CAPABILITIES:
- Answer technical questions thoroughly
- Generate clean, well-commented code
- Explain complex concepts clearly
- Help debug and solve problems
- Provide design guidance
- Work with project context when available

LIMITATIONS:
- You cannot execute code directly
- You do not have access to external tools unless explicitly provided
- You do not make up capabilities you don't have
- You clearly state when something is outside your current capabilities

WHEN UNCERTAIN:
- State clearly what you know and don't know
- Suggest approaches or alternatives when appropriate
- Never fabricate results or claim to have performed actions you didn't do

RESPONSE FORMAT:
- Use markdown for formatting
- Include code in appropriate language blocks
- Break down complex topics into digestible sections
- Provide practical examples when relevant

Remember: You are JANUARY, a trusted AI engineering assistant. Be helpful, technically accurate, and maintain your professional personality throughout the conversation.`;
}

/**
 * JANUARY AI Service - Singleton
 */
class JanuaryAIServicePrivate {
  private isInitialized = false;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('[JanuaryAI] Initializing JANUARY AI Service...');

    // Initialize Ollama service
    await ollamaService.initialize();

    this.isInitialized = true;
    console.log('[JanuaryAI] JANUARY AI Service initialized');
  }

  /**
   * Generate AI response for a conversation
   *
   * @param userMessage - Current user message
   * @param context - Conversation context
   * @param options - AI options
   * @returns JANUARY's response
   */
  async generateResponse(
    userMessage: string,
    context: JanuaryAIContext,
    options: JanuaryAIOptions = {}
  ): Promise<JanuaryResponse> {
    console.log('[JanuaryAI] Generating response...');
    console.log('[JanuaryAI] User message:', userMessage.substring(0, 100));

    try {
      // Initialize if needed
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Build messages for Ollama
      const messages = this.buildMessages(userMessage, context);

      console.log('[JanuaryAI] Total messages for AI:', messages.length);

      // Generate response using Ollama
      const ollamaResponse = await ollamaService.generateResponse(messages, {
        temperature: options.temperature ?? 0.7,
      });

      if (!ollamaResponse.success || !ollamaResponse.content) {
        throw new Error(ollamaResponse.error || 'Failed to generate AI response');
      }

      console.log('[JanuaryAI] Response generated, length:', ollamaResponse.content.length);

      return {
        content: ollamaResponse.content,
        success: true
      };
    } catch (error) {
      console.error('[JanuaryAI] Error generating response:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Build message array for AI
   * Includes system prompt and conversation history
   */
  private buildMessages(
    userMessage: string,
    context: JanuaryAIContext
  ): OllamaMessage[] {
    const messages: OllamaMessage[] = [];

    // Add JANUARY's system prompt
    messages.push({
      role: 'system',
      content: getJanuarySystemPrompt()
    });

    // Add conversation history (last 10 messages for context)
    const recentMessages = context.messages
      .slice(-10)
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    messages.push(...recentMessages);

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && ollamaService.isReady();
  }

  /**
   * Get service state
   */
  async getState() {
    const health = await ollamaService.checkHealth();
    return {
      initialized: this.isInitialized,
      ollamaReady: ollamaService.isReady(),
      ollamaRunning: health.running,
      modelInstalled: health.modelInstalled,
      currentModel: health.currentModel,
      baseUrl: ollamaService.getBaseUrl(),
      defaultModel: ollamaService.getDefaultModel(),
    };
  }

  /**
   * Get Ollama health status
   */
  async getHealthStatus() {
    return await ollamaService.checkHealth();
  }
}

// Export singleton instance
export const januaryAIService = new JanuaryAIServicePrivate();
