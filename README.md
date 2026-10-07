# AgentLab

AgentLab is a TypeScript-based AI agent laboratory for experimenting with and demonstrating core AI agent engineering concepts.

The project implements an AI agent from the ground up without using agent frameworks such as LangChain or LangGraph.

It demonstrates how an agent can:

- Understand a user request
- Select appropriate tools
- Execute tools
- Execute independent tools in parallel
- Execute dependent tools across multiple iterations
- Handle tool errors
- Recover from incorrect tool arguments
- Maintain agent state
- Enforce a tool execution policy
- Return structured results
- Expose the same tools through an MCP server

The goal is to understand the underlying mechanics of AI agents rather than hide them behind a framework.

---

## Features

- LLM integration using the OpenAI Responses API
- Function/tool calling
- Tool schema definitions
- Zod-based tool input validation
- Local tool registry
- Tool executor
- Tool execution policy
- Sequential tool execution
- Parallel independent tool execution
- Agent loop with configurable maximum iterations
- Agent state tracking
- Tool error handling and recovery
- PostgreSQL-backed data tool
- Structured agent response
- MCP server using stdio transport
- Existing tools exposed through MCP
- Unit tests with Vitest

---

# Architecture

```text
                         AgentLab
                            |
              +-------------+-------------+
              |                           |
              v                           v
         Local Agent                 MCP Server
              |                           |
         Agent Loop                 MCP Tools
              |                           |
         Tool Registry                    |
              |                           |
         Tool Executor                    |
              |                           |
              +-------------+-------------+
                            |
                     Same Tool Objects
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
     calculator       unitConverter     dataProcessor
                                              |
                                              v
                                          dataStore
                                              |
                                              v
                                          PostgreSQL
```

The local agent and MCP server use the **same tool implementations**.

There is no duplicated business logic between the local tools and MCP tools.

---

# Agent Execution Flow

A typical request follows this loop:

```text
User Request
     |
     v
    LLM
     |
     v
Tool Call(s)
     |
     v
Tool Executor
     |
     v
Tool Result(s)
     |
     v
    LLM
     |
     +--------> More tool calls
     |
     v
Final Response
```

The agent continues this process until:

1. The LLM produces a final response, or
2. The maximum iteration limit is reached.

---

# Independent Tool Calls

The agent supports multiple independent tool calls.

For example, if the LLM determines that two operations do not depend on each other:

```text
                    LLM
                     |
             +-------+-------+
             |               |
             v               v
        calculator     unitConverter
             |               |
             +-------+-------+
                     |
                     v
                    LLM
                     |
                     v
              Final response
```

These calls are executed concurrently using `Promise.all()`.

This avoids unnecessarily executing independent operations sequentially.

---

# Dependent Tool Calls

The agent also supports dependent operations.

For example:

```text
User:
"Get the sales data and calculate the average amount."
```

The agent can perform:

```text
Iteration 1

LLM
 |
 +----> dataStore
           |
           v
      sales records


Iteration 2

LLM
 |
 +----> dataProcessor
           |
           v
      average amount


Iteration 3

LLM
 |
 +----> Final response
```

The second tool call can depend on the result of the first tool call.

The agent loop handles this naturally because each new LLM response can contain another set of tool calls.

---

# Error Recovery

Tool failures are returned to the agent as structured results.

Example:

```json
{
  "success": false,
  "error": "Tool \"dataStore\" failed..."
}
```

The tool result is sent back to the LLM.

The LLM can then correct its arguments and retry the operation.

For example:

```text
LLM
 |
 +----> dataStore(limit=1000)
              |
              v
         Validation error
              |
              v
            LLM
              |
              +----> dataStore(limit=100)
                           |
                           v
                       Success
```

This allows the agent to recover from certain tool execution errors without hardcoding every possible recovery path.

---

# Tools

AgentLab currently provides four tools.

## 1. Calculator

Performs mathematical calculations.

```text
calculator
```

The calculator uses `mathjs` rather than JavaScript `eval()` because tool arguments originate from LLM-generated input.

Example:

```text
"What is 125 multiplied by 48?"
```

The LLM can generate:

```json
{
  "expression": "125 * 48"
}
```

The tool returns:

```text
6000
```

---

## 2. Unit Converter

Converts values between supported units.

```text
unitConverter
```

Examples:

```text
"Convert 10 kilometers to miles."

"Convert 5 kilograms to pounds."
```

Tool input:

```json
{
  "value": 10,
  "from": "km",
  "to": "mi"
}
```

---

## 3. Data Processor

Processes structured tabular data.

```text
dataProcessor
```

Supported operations:

```text
count
sum
average
```

Example:

```json
{
  "data": [
    {
      "id": 1,
      "product": "Laptop",
      "amount": 85000,
      "quantity": 2,
      "region": "North"
    }
  ],
  "operation": "average",
  "field": "amount"
}
```

---

## 4. Data Store

Reads structured sales records from PostgreSQL.

```text
dataStore
```

Currently the tool reads from the `sales` table.

Example data:

```text
+----+-------------+--------+----------+--------+
| id | product     | amount | quantity | region |
+----+-------------+--------+----------+--------+
| 1  | Laptop      | 85000  | 2        | North  |
| 2  | Monitor     | 25000  | 5        | South  |
| 3  | Keyboard    | 5000   | 10       | North  |
| 4  | Mouse       | 2000   | 20       | West   |
| 5  | Headphones  | 8000   | 7        | South  |
+----+-------------+--------+----------+--------+
```

---

# HTTP API

The local AI agent is exposed through an Express API.

## Start the API

```bash
npm run dev
```

The server starts on:

```text
http://localhost:4000
```

The port can be changed through the `PORT` environment variable.

---

## Health Check

### Endpoint

```http
GET /health
```

### Example

```bash
curl http://localhost:4000/health
```

### Response

```json
{
  "status": "ok",
  "service": "agent-lab"
}
```

---

# Agent Search API

## Endpoint

```http
POST /search
```

This endpoint sends a user query to the AI agent.

The agent decides whether tools are required, executes them when necessary, and returns the final response.

---

## Request

### Headers

```http
Content-Type: application/json
```

### Body

```json
{
  "query": "What is 125 multiplied by 48?"
}
```

### cURL

```bash
curl -X POST http://localhost:4000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is 125 multiplied by 48?"
  }'
```

---

## Example Response

```json
{
  "result": {
    "answer": "125 multiplied by 48 is 6000.",
    "iterations": 2,
    "toolsUsed": ["calculator"],
    "errors": []
  }
}
```

The response contains:

| Field        | Description                              |
| ------------ | ---------------------------------------- |
| `answer`     | Final response generated by the agent    |
| `iterations` | Number of agent iterations               |
| `toolsUsed`  | Tools used during execution              |
| `errors`     | Tool errors encountered during execution |

---

# Example: Data Query

Request:

```bash
curl -X POST http://localhost:4000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Get the sales records and calculate the average amount."
  }'
```

The agent can execute:

```text
dataStore
    |
    v
sales records
    |
    v
dataProcessor
    |
    v
average amount
```

The final response is then generated by the LLM.

---

# Example: Multiple Independent Tools

A query can require multiple independent operations.

For example:

```text
"Convert 10 km to miles and calculate 125 * 48."
```

The agent can request:

```text
calculator
unitConverter
```

These calls are independent and can execute in parallel.

---

# API Error Responses

Invalid requests return HTTP `400`.

Example:

```bash
curl -X POST http://localhost:4000/search \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:

```json
{
  "error": "query is required"
}
```

Unexpected agent execution errors return HTTP `500`:

```json
{
  "error": "Agent execution failed"
}
```

---

# MCP Server

AgentLab also exposes its existing tools through the **Model Context Protocol (MCP)**.

The MCP server uses **stdio transport**.

The MCP server is separate from the HTTP API.

```text
HTTP API
   |
   v
Local Agent
   |
   v
Local Tools


MCP Client
   |
   v
AgentLab MCP Server
   |
   v
Same Local Tools
```

---

# Start the MCP Server

Run:

```bash
npm run mcp
```

The server starts and waits for an MCP client connection over stdin/stdout.

The server prints startup information to stderr:

```text
[MCP] AgentLab MCP server started
[MCP] Exposed tools:
[MCP] - calculator
[MCP] - unitConverter
[MCP] - dataProcessor
[MCP] - dataStore
```

### Important

The MCP server uses stdout for MCP protocol communication.

Therefore, application/debug logs are written to stderr rather than stdout.

This keeps the JSON-RPC communication channel clean.

---

# MCP Tools

The AgentLab MCP server exposes:

```text
calculator
unitConverter
dataProcessor
dataStore
```

These are the **same tool objects** used by the local AI agent.

There is no second implementation of the tools.

```text
                Existing Tool
                     |
             +-------+-------+
             |               |
             v               v
       Local Agent       MCP Server
             |               |
             v               v
        ToolExecutor    MCP Client
```

---

# MCP Server Architecture

```text
                    MCP Client
                        |
                        | stdio
                        v
              +-------------------+
              | AgentLab MCP      |
              | Server            |
              +-------------------+
                        |
                 registerTool()
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
     calculator   unitConverter   dataProcessor
                                      |
                                      v
                                  dataStore
                                      |
                                      v
                                  PostgreSQL
```

The current AgentLab project acts as an **MCP server**.

An MCP client is intentionally kept outside this project.

---

# Project Structure

```text
agent-lab/
│
├── src/
│   │
│   ├── agent/
│   │   ├── Agent.ts
│   │   ├── AgentLoop.ts
│   │   ├── AgentResult.ts
│   │   └── AgentState.ts
│   │
│   ├── config/
│   │   └── env.ts
│   │
│   ├── db/
│   │   └── postgres.ts
│   │
│   ├── llm/
│   │   └── OpenAIClient.ts
│   │
│   ├── mcp/
│   │   └── server.ts
│   │
│   ├── policies/
│   │   └── ToolPolicy.ts
│   │
│   ├── tools/
│   │   ├── calculator.ts
│   │   ├── dataProcessor.ts
│   │   ├── dataStore.ts
│   │   ├── definitions.ts
│   │   ├── Tool.ts
│   │   ├── ToolExecutor.ts
│   │   ├── ToolRegistry.ts
│   │   ├── ToolResult.ts
│   │   └── unitConverter.ts
│   │
│   └── server.ts
│
├── tests/
│   ├── agentLoop.test.ts
│   ├── agentState.test.ts
│   ├── calculator.test.ts
│   ├── dataProcessor.test.ts
│   ├── dataStore.test.ts
│   ├── toolExecutor.test.ts
│   ├── toolPolicy.test.ts
│   ├── toolRegistry.test.ts
│   └── unitConverter.test.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

# Technology Stack

## Runtime

- Node.js
- TypeScript

## API

- Express

## AI

- OpenAI API
- OpenAI Responses API
- Function/tool calling

## Validation

- Zod

## Tools

- mathjs
- convert-units

## Database

- PostgreSQL
- pg

## MCP

- Model Context Protocol
- `@modelcontextprotocol/server`
- stdio transport

## Testing

- Vitest

---

# Environment Setup

## Requirements

- Node.js 22+
- PostgreSQL
- OpenAI API key

---

## 1. Clone

```bash
git clone <your-repository-url>

cd agent-lab
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Environment Variables

Create a `.env` file:

```env
PORT=4000

OPENAI_API_KEY=your_openai_api_key

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=agent_lab
```

Do not commit `.env`.

Use `.env.example` as the template for required variables.

---

# PostgreSQL Setup

Create the database:

```sql
CREATE DATABASE agent_lab;
```

Connect to it:

```bash
psql -U postgres -d agent_lab
```

Create the sales table:

```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    product VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    region VARCHAR(50) NOT NULL
);
```

Insert sample data:

```sql
INSERT INTO sales (product, amount, quantity, region)
VALUES
    ('Laptop', 85000, 2, 'North'),
    ('Monitor', 25000, 5, 'South'),
    ('Keyboard', 5000, 10, 'North'),
    ('Mouse', 2000, 20, 'West'),
    ('Headphones', 8000, 7, 'South');
```

---

# Running the Project

## Development API

```bash
npm run dev
```

Runs:

```text
http://localhost:4000
```

---

## MCP Server

```bash
npm run mcp
```

Starts the AgentLab MCP server using stdio transport.

---

## Production Build

Build TypeScript:

```bash
npm run build
```

The compiled output is generated in:

```text
dist/
```

Start the compiled API:

```bash
npm start
```

---

# Testing

Run tests in watch mode:

```bash
npm test
```

Run tests once:

```bash
npm test -- --run
```

The test suite covers the core agent and tool infrastructure, including:

- Calculator
- Unit converter
- Data processor
- Data store
- Tool registry
- Tool executor
- Tool policy
- Agent state
- Agent loop

The MCP server is currently validated by running the actual MCP server and verifying its exposed tools. MCP protocol integration testing will be introduced when an MCP client is added.

---

# Build Verification

Before pushing changes, run:

```bash
npm test -- --run
npm run build
```

Both should complete successfully.

---

# Design Decisions

## No Agent Framework

AgentLab intentionally does not use LangChain, LangGraph, or another agent framework.

The agent loop, state management, tool execution, policies, and LLM interaction are implemented directly.

This keeps the underlying mechanics visible.

---

## Local Tools and MCP Share Implementations

The MCP server does not create duplicate tools.

For example:

```text
calculator.ts
     |
     +------> Local Agent
     |
     +------> MCP Server
```

This keeps the actual capability in one place.

The MCP server acts as a protocol adapter around the existing tools.

---

## Parallel Tool Execution

Independent tool calls are executed concurrently using:

```ts
Promise.all();
```

Dependent calls are handled through subsequent agent iterations.

---

## Maximum Iterations

The agent has a maximum iteration limit to prevent uncontrolled agent loops.

---

## Tool Policy

The `ToolPolicy` layer controls which tools the agent is allowed to execute.

---

## Structured Tool Results

Tool execution returns a consistent result format:

```json
{
  "success": true,
  "data": {}
}
```

or:

```json
{
  "success": false,
  "error": "..."
}
```

This makes tool results predictable for both the agent and application code.

---

# Learning Goals

AgentLab was built to explore the engineering mechanics behind AI agents:

- LLM tool calling
- Tool schema design
- Tool selection
- Tool execution
- Tool validation
- Agent loops
- Sequential tool execution
- Parallel tool execution
- Error recovery
- Agent state
- Tool policies
- Structured responses
- Database-backed tools
- MCP server architecture
- MCP tool exposure
- stdio-based MCP communication

---

# Roadmap

The current AgentLab milestone focuses on the core agent and MCP server fundamentals.

Future experiments may include:

- MCP client agent
- Connecting to external MCP servers
- Guardrails
- Agent evaluation
- Advanced observability
- More advanced agent orchestration patterns

These are intentionally kept outside the current MVP.

---

# License

This project is intended as a learning and experimentation project.
