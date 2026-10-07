import { z } from "zod";
import { evaluate } from "mathjs";
import { Tool } from "./Tool.js";

const calculatorInputSchema = z.object({
  expression: z.string().min(1),
});

export const calculator: Tool<typeof calculatorInputSchema, number> = {
  name: "calculator",

  description: "Performs mathematical calculations. Always use this tool for arithmetic calculations instead of calculating the result yourself.",

  inputSchema: calculatorInputSchema,

  async execute(input) {
    const result = evaluate(input.expression);

    if (typeof result !== "number" || !Number.isFinite(result)) {
      throw new Error("Calculation did not produce a valid number");
    }

    return result;
  },
};