/**
 * Tool Registry - Architecture for future tool integration
 *
 * Tools can be added in future phases:
 * - WebSearchTool
 * - CodeTool
 * - VisionTool
 * - ThreeDTool
 * - IoTTool
 * - SimulationTool
 * - DocumentTool
 * - SystemTool
 *
 * Phase 2: Tool architecture exists, but no tools are implemented yet.
 */

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters?: {
      type: string;
      properties?: Record<string, unknown>;
      required?: string[];
    };
  };
}

export interface ToolCapability {
  name: string;
  description: string;
  enabled: boolean;
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Tool Registry - Manages available tools
 *
 * In Phase 2, the registry exists but no tools are active.
 * Future phases will register tools here.
 */
export class ToolRegistry {
  private tools = new Map<string, ToolCapability>();

  /**
   * Register a new tool
   */
  register(tool: ToolCapability): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): void {
    this.tools.delete(name);
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolCapability | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): ToolCapability[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all enabled tools
   */
  getEnabled(): ToolCapability[] {
    return Array.from(this.tools.values()).filter((t) => t.enabled);
  }

  /**
   * Check if a tool is enabled
   */
  isEnabled(name: string): boolean {
    const tool = this.tools.get(name);
    return tool?.enabled ?? false;
  }

  /**
   * Enable or disable a tool
   */
  setEnabled(name: string, enabled: boolean): void {
    const tool = this.tools.get(name);
    if (tool) {
      tool.enabled = enabled;
    }
  }

  /**
   * Execute a tool
   */
  async execute(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
      };
    }

    if (!tool.enabled) {
      return {
        success: false,
        error: `Tool "${name}" is not enabled`,
      };
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get tool definitions for AI (function calling format)
   */
  getDefinitions(): ToolDefinition[] {
    return this.getEnabled().map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    }));
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

/**
 * Future Tool Examples (for reference, not registered in Phase 2):
 *
 * WebSearchTool - Search the web for current information
 * CodeTool - Execute or validate code in a sandbox
 * VisionTool - Analyze images and camera feeds
 * ThreeDTool - Generate or manipulate 3D models
 * IoTTool - Control connected devices
 * SimulationTool - Run scientific simulations
 * DocumentTool - Search and analyze uploaded documents
 * SystemTool - Perform system-level operations
 */
