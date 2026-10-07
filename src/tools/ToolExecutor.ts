import { ToolRegistry } from "./ToolRegistry.js";
import { ToolResult } from "./ToolResult.js";

export class ToolExecutor {
  constructor(private readonly registry: ToolRegistry) {}

  async execute(
    toolName: string,
    input: unknown,
  ): Promise<ToolResult> {
    const tool = this.registry.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" not found`,
      };
    }

    try {
      const validatedInput = tool.inputSchema.parse(input);

      const result = await tool.execute(validatedInput);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown tool execution error",
      };
    }
  }
}