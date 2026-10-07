import express from "express";
import { env } from "./config/env.js";

import { OpenAIClient } from "./llm/OpenAIClient.js";

import { ToolRegistry } from "./tools/ToolRegistry.js";
import { ToolExecutor } from "./tools/ToolExecutor.js";

import { calculator } from "./tools/calculator.js";
import { unitConverter } from "./tools/unitConverter.js";
import { dataProcessor } from "./tools/dataProcessor.js";
import { dataStore } from "./tools/dataStore.js";

import { toolDefinitions } from "./tools/definitions.js";

import { AgentLoop } from "./agent/AgentLoop.js";
import { Agent } from "./agent/Agent.js";

import { ToolPolicy } from "./policies/ToolPolicy.js";

const app = express();

app.use(express.json());

/*
 * --------------------------------------------------
 * Tool Registry
 * --------------------------------------------------
 *
 * AgentLab owns and executes these tools locally.
 */

const toolRegistry = new ToolRegistry();

toolRegistry.register(calculator);
toolRegistry.register(unitConverter);
toolRegistry.register(dataProcessor);
toolRegistry.register(dataStore);

/*
 * --------------------------------------------------
 * Tool Executor
 * --------------------------------------------------
 */

const toolExecutor = new ToolExecutor(
  toolRegistry,
);

/*
 * --------------------------------------------------
 * LLM
 * --------------------------------------------------
 */

const llm = new OpenAIClient(
  env.openAIAPIKey,
);

/*
 * --------------------------------------------------
 * Tool Policy
 * --------------------------------------------------
 */

const toolPolicy = new ToolPolicy(
  new Set([
    "calculator",
    "unitConverter",
    "dataProcessor",
    "dataStore",
  ]),
);

/*
 * --------------------------------------------------
 * Agent Loop
 * --------------------------------------------------
 */

const agentLoop = new AgentLoop(
  llm,
  toolExecutor,
  toolDefinitions,
  toolPolicy,
);

const agent = new Agent(agentLoop);

/*
 * --------------------------------------------------
 * Health
 * --------------------------------------------------
 */

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "agent-lab",
  });
});

/*
 * --------------------------------------------------
 * Agent endpoint
 * --------------------------------------------------
 */

app.post("/search", async (req, res) => {
  try {
    const { query } = req.body;

    if (
      typeof query !== "string" ||
      query.trim() === ""
    ) {
      return res.status(400).json({
        error: "query is required",
      });
    }

    const result = await agent.run(query);

    return res.json({
      result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Agent execution failed",
    });
  }
});

/*
 * --------------------------------------------------
 * Start AgentLab
 * --------------------------------------------------
 */

app.listen(env.port, () => {
  console.log(
    `AgentLab running on port ${env.port}`,
  );
});