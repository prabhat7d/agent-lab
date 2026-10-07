import { describe, expect, it } from "vitest";
import { unitConverter } from "../src/tools/unitConverter.js";

describe("unitConverter", () => {
  it("converts kilometers to miles", async () => {
    const result = await unitConverter.execute({
      value: 25,
      from: "km",
      to: "mi",
    });

    expect(result).toBeCloseTo(15.5343, 4);
  });

  it("converts kilograms to pounds", async () => {
    const result = await unitConverter.execute({
      value: 10,
      from: "kg",
      to: "lb",
    });

    expect(result).toBeCloseTo(22.0462, 4);
  });

  it("converts Celsius to Fahrenheit", async () => {
    const result = await unitConverter.execute({
      value: 100,
      from: "C",
      to: "F",
    });

    expect(result).toBe(212);
  });

  it("handles conversion from a unit to itself", async () => {
    const result = await unitConverter.execute({
      value: 100,
      from: "km",
      to: "km",
    });

    expect(result).toBe(100);
  });

  it("throws for an unsupported unit", async () => {
    await expect(
      unitConverter.execute({
        value: 10,
        from: "invalid",
        to: "km",
      }),
    ).rejects.toThrow();
  });
});