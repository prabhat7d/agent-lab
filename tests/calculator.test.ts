import { describe, expect, it } from "vitest";
import { calculator } from "../src/tools/calculator.js";

describe("calculator", () => {
  it("calculates an expression", async () => {
    const result = await calculator.execute({
      expression: "850 * 0.15",
    });

    expect(result).toBe(127.5);
  });

  it("calculates complex expressions", async () => {
    const result = await calculator.execute({
      expression: "(100 + 50) / 2",
    });

    expect(result).toBe(75);
  });

  it("supports operator precedence", async () => {
    const result = await calculator.execute({
      expression: "10 + 5 * 2",
    });

    expect(result).toBe(20);
  });

  it("rejects an invalid expression", async () => {
    await expect(
      calculator.execute({
        expression: "invalid expression",
      }),
    ).rejects.toThrow();
  });

  it("rejects a non-finite result", async () => {
    await expect(
      calculator.execute({
        expression: "1 / 0",
      }),
    ).rejects.toThrow("Calculation did not produce a valid number");
  });
});