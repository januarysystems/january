/**
 * Context Manager - Handles conversation, memory, and project context for AI
 *
 * Responsibilities:
 * 1. Manage conversation context
 * 2. Retrieve relevant memories
 * 3. Provide project context
 * 4. Optimize context to avoid unnecessary token usage
 */

import type { AIMessage } from "./providers";
import type { OrchestratorContext } from "./orchestrator";
import { listMemories } from "../api";
import type { Memory } from "../api";

export interface ContextManagerOptions {
  maxConversationHistory?: number;
  maxMemories?: number;
  minMemoryImportance?: number;
  conversationId?: string | null;
  projectId?: string | null;
}

export class ContextManager {
  /**
   * Build complete context for AI request
   */
  async buildContext(options: ContextManagerOptions = {}): Promise<OrchestratorContext> {
    const {
      maxConversationHistory = 10,
      maxMemories = 5,
      minMemoryImportance = 3,
      conversationId,
      projectId,
    } = options;

    // Get conversation context
    const conversation = {
      id: conversationId || null,
      messages: [], // Will be populated by the chat component
    };

    // Get relevant memories
    const memories = await this.getRelevantMemories(maxMemories, minMemoryImportance);

    // Get project context if project ID is provided
    const project = projectId ? await this.getProjectContext(projectId) : undefined;

    // Get user settings (defaults for now)
    const userSettings = await this.getUserSettings();

    return {
      conversation,
      memories,
      project,
      userSettings,
    };
  }

  /**
   * Get relevant memories based on importance and recency
   */
  private async getRelevantMemories(
    limit: number,
    minImportance: number
  ): Promise<Array<{ id: string; title: string; content: string; category: string; importance: number }>> {
    try {
      const allMemories = await listMemories();

      // Filter by importance and sort by recency and importance
      const relevantMemories = allMemories
        .filter((m) => (m.importance || 0) >= minImportance)
        .sort((a, b) => {
          // First sort by importance (higher first)
          const importanceDiff = (b.importance || 0) - (a.importance || 0);
          if (importanceDiff !== 0) return importanceDiff;

          // Then sort by pinned status
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;

          // Finally sort by updated date
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        })
        .slice(0, limit)
        .map((m) => ({
          id: m.id,
          title: m.title,
          content: m.content,
          category: m.category,
          importance: m.importance || 0,
        }));

      return relevantMemories;
    } catch (error) {
      console.error("Failed to retrieve memories:", error);
      return [];
    }
  }

  /**
   * Get active project context by ID
   */
  private async getProjectContext(projectId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    category?: string;
  } | undefined> {
    try {
      // Import dynamically to avoid circular dependency
      const { listProjects } = await import("../api");
      const projects = await listProjects();
      const project = projects.find((p) => p.id === projectId);

      if (!project) return undefined;

      return {
        id: project.id,
        name: project.name,
        description: project.description || undefined,
        category: project.category || undefined,
      };
    } catch (error) {
      console.error("Failed to retrieve project context:", error);
      return undefined;
    }
  }

  /**
   * Get user settings for language preference
   */
  private async getUserSettings(): Promise<{
    language: string;
    voiceEnabled: boolean;
    theme: string;
  }> {
    try {
      const { getSettings } = await import("../api");
      const settings = await getSettings();

      return {
        language: settings?.language || "en",
        voiceEnabled: settings?.voice_enabled ?? true,
        theme: settings?.theme || "dark",
      };
    } catch (error) {
      console.error("Failed to retrieve user settings:", error);
      return {
        language: "en",
        voiceEnabled: true,
        theme: "dark",
      };
    }
  }

  /**
   * Search memories by keyword for context retrieval
   */
  async searchMemories(query: string, limit: number = 5): Promise<Array<{ id: string; title: string; content: string; category: string; importance: number }>> {
    try {
      const allMemories = await listMemories();
      const lowerQuery = query.toLowerCase();

      const results = allMemories
        .filter((m) => {
          const titleMatch = m.title.toLowerCase().includes(lowerQuery);
          const contentMatch = m.content.toLowerCase().includes(lowerQuery);
          const categoryMatch = m.category.toLowerCase().includes(lowerQuery);
          return titleMatch || contentMatch || categoryMatch;
        })
        .sort((a, b) => (b.importance || 0) - (a.importance || 0))
        .slice(0, limit)
        .map((m) => ({
          id: m.id,
          title: m.title,
          content: m.content,
          category: m.category,
          importance: m.importance || 0,
        }));

      return results;
    } catch (error) {
      console.error("Failed to search memories:", error);
      return [];
    }
  }

  /**
   * Detect if a user message is a memory request
   */
  detectMemoryRequest(message: string): {
    isMemoryRequest: boolean;
    title?: string;
    content: string;
    category?: string;
    importance?: number;
  } | null {
    const lowerMessage = message.toLowerCase();

    // Memory request patterns
    const memoryPatterns = [
      /remember (that|this|when)/i,
      /don't forget/i,
      /keep in mind/i,
      /save this/i,
      /my preference/i,
      /i always use/i,
      /i prefer/i,
    ];

    const isMemoryRequest = memoryPatterns.some((pattern) => pattern.test(lowerMessage));

    if (!isMemoryRequest) {
      return null;
    }

    // Extract memory content
    const content = message
      .replace(/remember (that|this|when):?\s*/i, "")
      .replace(/don't forget:?\s*/i, "")
      .replace(/keep in mind:?\s*/i, "")
      .replace(/save this:?\s*/i, "")
      .trim();

    // Generate title from first sentence
    const firstSentence = content.split(/[.!?]/)[0];
    const title = firstSentence.length > 50
      ? firstSentence.substring(0, 47) + "..."
      : firstSentence;

    return {
      isMemoryRequest: true,
      title,
      content,
      category: "preference",
      importance: 4,
    };
  }

  /**
   * Check if context needs summarization
   */
  needsSummarization(messageCount: number, tokenEstimate: number): boolean {
    // Rough heuristic: summarize if > 50 messages or estimated > 8000 tokens
    const MESSAGE_TOKEN_THRESHOLD = 50;
    const TOKEN_THRESHOLD = 8000;

    return messageCount > MESSAGE_TOKEN_THRESHOLD || tokenEstimate > TOKEN_THRESHOLD;
  }
}

// Singleton instance
export const contextManager = new ContextManager();
