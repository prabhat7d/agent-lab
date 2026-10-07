import "dotenv/config";

const port = Number(process.env.PORT ?? 4000);
const openAIAPIKey = process.env.OPENAI_API_KEY;

if (!openAIAPIKey) {
  throw new Error("OPENAI_API_KEY is not configured");
}

export const env = {
  port,
  openAIAPIKey,
  database: {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "agent_lab",
  },
};