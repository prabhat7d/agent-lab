import { z } from "zod";
import { Tool } from "./Tool.js";

const dataProcessorInputSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  operation: z.enum(["count", "sum", "average"]),
  field: z.string().optional(),
});

export const dataProcessor: Tool<
  typeof dataProcessorInputSchema,
  unknown
> = {
  name: "dataProcessor",

  description:
    "Processes structured tabular data. Use this tool to count records or calculate the sum or average of a numeric field.",

  inputSchema: dataProcessorInputSchema,

  async execute(input) {
    switch (input.operation) {
      case "count":
        return input.data.length;

      case "sum": {
        if (!input.field) {
          throw new Error("field is required for sum operation");
        }

        return input.data.reduce((total, row) => {
          const value = row[input.field!];

          if (typeof value !== "number") {
            throw new Error(
              `Field "${input.field}" must contain numeric values`,
            );
          }

          return total + value;
        }, 0);
      }

      case "average": {
        if (!input.field) {
          throw new Error("field is required for average operation");
        }

        if (input.data.length === 0) {
          return 0;
        }

        const total = input.data.reduce((sum, row) => {
          const value = row[input.field!];

          if (typeof value !== "number") {
            throw new Error(
              `Field "${input.field}" must contain numeric values`,
            );
          }

          return sum + value;
        }, 0);

        return total / input.data.length;
      }
    }
  },
};