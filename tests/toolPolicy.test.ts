import { describe, expect, it } from "vitest";
import { ToolPolicy } from "../src/policies/ToolPolicy.js";

describe("ToolPolicy", () => {
  it("allows a registered tool", () => {
    const policy = new ToolPolicy(
      new Set(["calculator", "unitConverter"]),
    );

    expect(policy.isAllowed("calculator")).toBe(true);
  });

  it("allows multiple registered tools", () => {
    const policy = new ToolPolicy(
      new Set(["calculator", "unitConverter"]),
    );

    expect(policy.isAllowed("calculator")).toBe(true);
    expect(policy.isAllowed("unitConverter")).toBe(true);
  });

  it("blocks a tool that is not allowed", () => {
    const policy = new ToolPolicy(
      new Set(["calculator"]),
    );

    expect(policy.isAllowed("dataStore")).toBe(false);
  });

  it("blocks an unknown tool", () => {
    const policy = new ToolPolicy(
      new Set(["calculator"]),
    );

    expect(policy.isAllowed("unknown")).toBe(false);
  });
});