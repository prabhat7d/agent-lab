import { z } from "zod";
import { pool } from "../db/postgres.js";
import { Tool } from "./Tool.js";

const dataStoreInputSchema = z.object({
  table: z.enum(["sales"]),
  limit: z.number().int().min(1).max(100).default(20),
});

type SalesRecord = {
  id: number;
  product: string;
  amount: number;
  quantity: number;
  region: string;
};

export const dataStore: Tool<
  typeof dataStoreInputSchema,
  SalesRecord[]
> = {
  name: "dataStore",

  description:
    "Reads structured records from the application's data store. Use this tool when the user asks to retrieve stored sales data. Only read data; do not modify records.",

  inputSchema: dataStoreInputSchema,

  async execute(input) {
    const result = await pool.query<SalesRecord>(
      `
        SELECT id, product, amount, quantity, region
        FROM ${input.table}
        ORDER BY id
        LIMIT $1
      `,
      [input.limit],
    );

    return result.rows.map((row) => ({
  ...row,
  amount: Number(row.amount),
}));
  },
};