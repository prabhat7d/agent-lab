import { calculator } from "./calculator.js";
import { unitConverter } from "./unitConverter.js";
import { dataProcessor } from "./dataProcessor.js";
import { dataStore } from "./dataStore.js";

export const toolDefinitions = [
  {
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
  },

  {
    type: "function" as const,
    name: unitConverter.name,
    description: unitConverter.description,
    parameters: {
      type: "object",
      properties: {
        value: {
          type: "number",
          description: "The numeric value to convert.",
        },
        from: {
          type: "string",
          description: "The source unit.",
        },
        to: {
          type: "string",
          description: "The target unit.",
        },
      },
      required: ["value", "from", "to"],
      additionalProperties: false,
    },
    strict: true,
  },

  {
    type: "function" as const,
    name: dataProcessor.name,
    description: dataProcessor.description,
    parameters: {
      type: "object",
      properties: {
        data: {
          type: "array",
          description: "Sales records to process.",
          items: {
            type: "object",
            properties: {
              id: {
                type: "number",
              },
              product: {
                type: "string",
              },
              amount: {
                type: "number",
              },
              quantity: {
                type: "number",
              },
              region: {
                type: "string",
              },
            },
            required: [
              "id",
              "product",
              "amount",
              "quantity",
              "region",
            ],
            additionalProperties: false,
          },
        },
        operation: {
          type: "string",
          enum: ["count", "sum", "average"],
        },
        field: {
          type: "string",
        },
      },
      required: ["data", "operation", "field"],
      additionalProperties: false,
    },
    strict: true,
  },

  {
    type: "function" as const,
    name: dataStore.name,
    description: dataStore.description,
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          enum: ["sales"],
          description: "The dataset to read.",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to retrieve. Must be between 1 and 100.",
        },
      },
      required: ["table", "limit"],
      additionalProperties: false,
    },
    strict: true,
  },
];