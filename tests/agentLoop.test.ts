import { describe, expect, it, vi } from "vitest";
import { AgentLoop } from "../src/agent/AgentLoop.js";
import { ToolExecutor } from "../src/tools/ToolExecutor.js";
import { ToolRegistry } from "../src/tools/ToolRegistry.js";
import { calculator } from "../src/tools/calculator.js";
import { ToolPolicy } from "../src/policies/ToolPolicy.js";

describe("AgentLoop", () => {
  function createExecutor() {
    const registry = new ToolRegistry();

    registry.register(calculator);

    return new ToolExecutor(registry);
  }

  function createPolicy() {
    return new ToolPolicy(
      new Set(["calculator"]),
    );
  }

  it("returns the final response when no tool is requested", async () => {
    const llm = {
      respond: vi.fn().mockResolvedValue({
        id: "response-1",
        output: [],
        output_text: "The answer is 127.5.",
      }),
    };

    const agent = new AgentLoop(
      llm as any,
      createExecutor(),
      [],
      createPolicy(),
    );

    const result = await agent.run(
      "What is the answer?",
    );

    expect(result).toEqual({
      answer: "The answer is 127.5.",
      iterations: 1,
      toolsUsed: [],
      errors: [],
    });

    expect(llm.respond).toHaveBeenCalledTimes(1);
  });

  it("executes a requested tool and sends the result back to the LLM", async () => {
    const llm = {
      respond: vi
        .fn()
        .mockResolvedValueOnce({
          id: "response-1",
          output: [
            {
              type: "function_call",
              name: "calculator",
              arguments: JSON.stringify({
                expression: "850 * 0.15",
              }),
              call_id: "call-1",
            },
          ],
          output_text: "",
        })
        .mockResolvedValueOnce({
          id: "response-2",
          output: [],
          output_text: "The answer is 127.5.",
        }),
    };

    const agent = new AgentLoop(
      llm as any,
      createExecutor(),
      [],
      createPolicy(),
    );

    const result = await agent.run(
      "Calculate 15% of 850.",
    );

    expect(result).toEqual({
      answer: "The answer is 127.5.",
      iterations: 2,
      toolsUsed: ["calculator"],
      errors: [],
    });

    expect(llm.respond).toHaveBeenCalledTimes(2);

    const secondCall = llm.respond.mock.calls[1];

    expect(secondCall[0]).toEqual([
      {
        type: "function_call_output",
        call_id: "call-1",
        output: JSON.stringify({
          success: true,
          data: 127.5,
        }),
      },
    ]);

    expect(secondCall[2]).toBe("response-1");
  });

  it("blocks a tool that is not allowed by policy", async () => {
    const llm = {
      respond: vi
        .fn()
        .mockResolvedValueOnce({
          id: "response-1",
          output: [
            {
              type: "function_call",
              name: "dataStore",
              arguments: JSON.stringify({
                table: "sales",
                limit: 20,
              }),
              call_id: "call-1",
            },
          ],
          output_text: "",
        })
        .mockResolvedValueOnce({
          id: "response-2",
          output: [],
          output_text: "I cannot access the requested data.",
        }),
    };

    const agent = new AgentLoop(
      llm as any,
      createExecutor(),
      [],
      createPolicy(),
    );

    const result = await agent.run(
      "Get the sales records.",
    );

    expect(result).toEqual({
      answer: "I cannot access the requested data.",
      iterations: 2,
      toolsUsed: ["dataStore"],
      errors: ['Tool "dataStore" is not allowed'],
    });
  });

  it("handles invalid JSON tool arguments", async () => {
    const llm = {
      respond: vi
        .fn()
        .mockResolvedValueOnce({
          id: "response-1",
          output: [
            {
              type: "function_call",
              name: "calculator",
              arguments: "{invalid-json",
              call_id: "call-1",
            },
          ],
          output_text: "",
        })
        .mockResolvedValueOnce({
          id: "response-2",
          output: [],
          output_text: "I could not process the calculation.",
        }),
    };

    const agent = new AgentLoop(
      llm as any,
      createExecutor(),
      [],
      createPolicy(),
    );

    const result = await agent.run(
      "Calculate something.",
    );

    expect(result).toEqual({
      answer: "I could not process the calculation.",
      iterations: 2,
      toolsUsed: ["calculator"],
      errors: [
        'Invalid JSON arguments for tool "calculator"',
      ],
    });
  });

  it("stops when maximum iterations are exceeded", async () => {
    const llm = {
      respond: vi.fn().mockResolvedValue({
        id: "response-1",
        output: [
          {
            type: "function_call",
            name: "calculator",
            arguments: JSON.stringify({
              expression: "10 + 5",
            }),
            call_id: "call-1",
          },
        ],
        output_text: "",
      }),
    };

    const agent = new AgentLoop(
      llm as any,
      createExecutor(),
      [],
      createPolicy(),
      2,
    );

    const result = await agent.run(
      "Keep calculating.",
    );

    expect(result.answer).toBe(
      "The agent could not complete the request within the allowed number of steps.",
    );

    expect(result.iterations).toBe(2);

    expect(result.toolsUsed).toEqual([
      "calculator",
    ]);

    expect(result.errors).toContain(
      "Maximum agent iterations (2) exceeded",
    );
  });

  it("executes multiple independent tool calls in parallel", async () => {
    const slowCalculator = {
      ...calculator,
      name: "slowCalculator",

      async execute(input: {
        expression: string;
      }) {
        await new Promise((resolve) =>
          setTimeout(resolve, 100),
        );

        return calculator.execute(input);
      },
    };

    const slowCalculator2 = {
      ...calculator,
      name: "slowCalculator2",

      async execute(input: {
        expression: string;
      }) {
        await new Promise((resolve) =>
          setTimeout(resolve, 100),
        );

        return calculator.execute(input);
      },
    };

    const registry = new ToolRegistry();

    registry.register(slowCalculator);
    registry.register(slowCalculator2);

    const executor = new ToolExecutor(registry);

    const policy = new ToolPolicy(
      new Set([
        "slowCalculator",
        "slowCalculator2",
      ]),
    );

    const llm = {
      respond: vi
        .fn()
        .mockResolvedValueOnce({
          id: "response-1",
          output: [
            {
              type: "function_call",
              name: "slowCalculator",
              arguments: JSON.stringify({
                expression: "10 + 5",
              }),
              call_id: "call-1",
            },
            {
              type: "function_call",
              name: "slowCalculator2",
              arguments: JSON.stringify({
                expression: "20 + 5",
              }),
              call_id: "call-2",
            },
          ],
          output_text: "",
        })
        .mockResolvedValueOnce({
          id: "response-2",
          output: [],
          output_text: "The calculations are complete.",
        }),
    };

    const agent = new AgentLoop(
      llm as any,
      executor,
      [],
      policy,
    );

    const start = Date.now();

    const result = await agent.run(
      "Calculate both 10 + 5 and 20 + 5.",
    );

    const duration = Date.now() - start;

    expect(result.answer).toBe(
      "The calculations are complete.",
    );

    expect(result.toolsUsed).toEqual([
      "slowCalculator",
      "slowCalculator2",
    ]);

    expect(duration).toBeLessThan(180);
  });
});