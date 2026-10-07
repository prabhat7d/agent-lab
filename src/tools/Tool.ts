import { z } from "zod";

export interface Tool<TInput extends z.ZodTypeAny, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: TInput;
  execute(input: z.infer<TInput>): Promise<TOutput>;
}