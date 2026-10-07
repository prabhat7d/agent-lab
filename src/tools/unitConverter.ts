import { z } from "zod";
import convert from "convert-units";
import { Tool } from "./Tool.js";

const unitConverterInputSchema = z.object({
  value: z.number(),
  from: z.string().min(1),
  to: z.string().min(1),
});

export const unitConverter: Tool<
  typeof unitConverterInputSchema,
  number
> = {
  name: "unitConverter",

  description:
    "Converts a value from one unit to another. Use this tool whenever the user asks to convert units such as length, weight, temperature, volume, or digital storage.",

  inputSchema: unitConverterInputSchema,

  async execute(input) {
    return convert(input.value)
      .from(input.from)
      .to(input.to);
  },
};