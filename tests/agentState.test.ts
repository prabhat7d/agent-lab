import { describe, expect, it } from "vitest";
import { AgentState } from "../src/agent/AgentState.js";

describe("AgentState", () => {
  it("stores the user input", () => {
    const state = new AgentState("Calculate 15% of 850");

    expect(state.userInput).toBe("Calculate 15% of 850");
  });

  it("tracks tool executions", () => {
    const state = new AgentState("Calculate 15% of 850");

    state.iteration = 1;

    state.addToolExecution({
      toolName: "calculator",
      arguments: {
        expression: "850 * 0.15",
      },
      result: {
        success: true,
        data: 127.5,
      },
    });

    expect(state.toolExecutions).toHaveLength(1);
    expect(state.toolExecutions[0].toolName).toBe("calculator");
  });

  it("tracks unique tools used", () => {
    const state = new AgentState("Calculate something");

    state.addToolExecution({
      toolName: "calculator",
      arguments: {},
      result: {
        success: true,
        data: 10,
      },
    });

    state.addToolExecution({
      toolName: "calculator",
      arguments: {},
      result: {
        success: true,
        data: 20,
      },
    });

    expect(state.getToolsUsed()).toEqual(["calculator"]);
  });

  it("tracks multiple different tools", () => {
    const state = new AgentState("Convert and calculate");

    state.addToolExecution({
      toolName: "calculator",
      arguments: {},
      result: {
        success: true,
        data: 10,
      },
    });

    state.addToolExecution({
      toolName: "unitConverter",
      arguments: {},
      result: {
        success: true,
        data: 20,
      },
    });

    expect(state.getToolsUsed()).toEqual([
      "calculator",
      "unitConverter",
    ]);
  });

  it("tracks tool errors", () => {
    const state = new AgentState("Calculate something");

    state.addToolExecution({
      toolName: "calculator",
      arguments: {},
      result: {
        success: false,
        error: "Calculation failed",
      },
    });

    expect(state.errors).toEqual(["Calculation failed"]);
  });

  it("sets the final response", () => {
    const state = new AgentState("Calculate something");

    state.setFinalResponse("The answer is 127.5.");

    expect(state.finalResponse).toBe("The answer is 127.5.");
  });

  it("returns a complete summary", () => {
    const state = new AgentState("Calculate something");

    state.iteration = 2;
    state.setFinalResponse("The answer is 127.5.");

    const summary = state.getSummary();

    expect(summary).toEqual({
      userInput: "Calculate something",
      iterations: 2,
      toolExecutions: [],
      errors: [],
      finalResponse: "The answer is 127.5.",
    });
  });
});