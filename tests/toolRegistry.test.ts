import { describe, expect, it } from "vitest";
import { ToolRegistry } from "../src/tools/ToolRegistry.js";

const createTestTool = (name: string) => ({
  name,
  description: `A ${name} tool`,
  inputSchema: {} as any,

  async execute() {
    return "done";
  },
});

describe("ToolRegistry", () => {
  it("registers and retrieves a tool", () => {
    const registry = new ToolRegistry();
    const testTool = createTestTool("test");

    registry.register(testTool);

    expect(registry.get("test")).toBe(testTool);
  });

  it("returns all registered tools", () => {
    const registry = new ToolRegistry();

    registry.register(createTestTool("tool1"));
    registry.register(createTestTool("tool2"));

    expect(registry.getAll()).toHaveLength(2);
  });

  it("prevents duplicate tools", () => {
    const registry = new ToolRegistry();
    const testTool = createTestTool("test");

    registry.register(testTool);

    expect(() => registry.register(testTool)).toThrow(
      'Tool "test" is already registered',
    );
  });

  it("returns undefined for an unknown tool", () => {
    const registry = new ToolRegistry();

    expect(registry.get("unknown")).toBeUndefined();
  });
});