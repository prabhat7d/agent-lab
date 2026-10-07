import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { calculator } from "../tools/calculator.js";
import { unitConverter } from "../tools/unitConverter.js";
import { dataProcessor } from "../tools/dataProcessor.js";
import { dataStore } from "../tools/dataStore.js";

const server = new McpServer({
  name: "agent-lab",
  version: "1.0.0",
});

server.registerTool(
  calculator.name,
  {
    description: calculator.description,
    inputSchema: calculator.inputSchema,
  },
  async (input) => {
    const result = await calculator.execute(input);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  },
);

server.registerTool(
  unitConverter.name,
  {
    description: unitConverter.description,
    inputSchema: unitConverter.inputSchema,
  },
  async (input) => {
    const result = await unitConverter.execute(input);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  },
);

server.registerTool(
  dataProcessor.name,
  {
    description: dataProcessor.description,
    inputSchema: dataProcessor.inputSchema,
  },
  async (input) => {
    const result = await dataProcessor.execute(input);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  },
);

server.registerTool(
  dataStore.name,
  {
    description: dataStore.description,
    inputSchema: dataStore.inputSchema,
  },
  async (input) => {
    const result = await dataStore.execute(input);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  },
);

console.error("[MCP] AgentLab MCP server started");
console.error("[MCP] Exposed tools:");
console.error(`[MCP] - ${calculator.name}`);
console.error(`[MCP] - ${unitConverter.name}`);
console.error(`[MCP] - ${dataProcessor.name}`);
console.error(`[MCP] - ${dataStore.name}`);

serveStdio(() => server);