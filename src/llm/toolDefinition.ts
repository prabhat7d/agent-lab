import { calculator } from "../tools/calculator.js";

export const calculatorToolDefinition = {
  type: "function" as const,
  name: calculator.name,
  description: calculator.description,
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Mathematical expression to calculate.",
      },
    },
    required: ["expression"],
    additionalProperties: false,
  },
  strict: true,
};