import { describe, expect, it } from "vitest";
import { ToolExecutor } from "../src/tools/ToolExecutor.js";
import { ToolRegistry } from "../src/tools/ToolRegistry.js";
import { calculator } from "../src/tools/calculator.js";

describe("ToolExecutor", () => {
  it("executes a registered tool", async () => {
    const registry = new ToolRegistry();
    registry.register(calculator);

    const executor = new ToolExecutor(registry);

    const result = await executor.execute("calculator", {
      expression: "850 * 0.15",
    });

    expect(result).toEqual({
      success: true,
      data: 127.5,
    });
  });

  it("returns an error when tool does not exist", async () => {
    const registry = new ToolRegistry();
    const executor = new ToolExecutor(registry);

    const result = await executor.execute("unknown", {});

    expect(result).toEqual({
      success: false,
      error: 'Tool "unknown" not found',
    });
  });

  it("returns an error for invalid input", async () => {
    const registry = new ToolRegistry();
    registry.register(calculator);

    const executor = new ToolExecutor(registry);

    const result = await executor.execute("calculator", {
      expression: 123,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error).toContain("Invalid input");
    }
  });

  it("returns an error when tool execution fails", async () => {
    const registry = new ToolRegistry();
    registry.register(calculator);

    const executor = new ToolExecutor(registry);

    const result = await executor.execute("calculator", {
      expression: "invalid expression",
    });

    expect(result).toEqual({
      success: false,
      error: expect.any(String),
    });
  });
});