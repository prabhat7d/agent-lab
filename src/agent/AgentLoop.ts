import OpenAI from "openai";
import { OpenAIClient } from "../llm/OpenAIClient.js";
import { ToolExecutor } from "../tools/ToolExecutor.js";
import { AgentState } from "./AgentState.js";
import { AgentResult } from "./AgentResult.js";
import { ToolPolicy } from "../policies/ToolPolicy.js";

export class AgentLoop {
  constructor(
    private readonly llm: OpenAIClient,
    private readonly toolExecutor: ToolExecutor,
    private readonly toolDefinitions: OpenAI.Responses.Tool[],
    private readonly toolPolicy: ToolPolicy,
    private readonly maxIterations = 10,
  ) {}

  async run(userInput: string): Promise<AgentResult> {
  const state = new AgentState(userInput);

  console.log("[Agent] Starting agent");
  console.log(`[Agent] User input: ${userInput}`);

  let response = await this.llm.respond(
    userInput,
    this.toolDefinitions,
  );

  for (let iteration = 0; iteration < this.maxIterations; iteration++) {
    state.iteration = iteration + 1;

    console.log(
      `[Agent] Iteration ${state.iteration}`,
    );

    const functionCalls = response.output.filter(
      (item) => item.type === "function_call",
    );

    if (functionCalls.length === 0) {
      console.log(
        "[Agent] No tool calls. Returning final response.",
      );

      state.setFinalResponse(response.output_text);

      console.log(
        "[Agent] Final state:",
        JSON.stringify(state.getSummary(), null, 2),
      );

      const result: AgentResult = {
        answer: response.output_text,
        iterations: state.iteration,
        toolsUsed: [
          ...new Set(
            state.toolExecutions.map(
              (execution) => execution.toolName,
            ),
          ),
        ],
        errors: state.errors,
      };

      return result;
    }

    console.log(
      `[Agent] Tools requested: ${functionCalls.length}`,
    );

    const toolOutputs = await Promise.all(
      functionCalls.map(async (functionCall) => {
        console.log(
          `[Agent] Calling tool: ${functionCall.name}`,
        );

        console.log(
          `[Agent] Tool arguments: ${functionCall.arguments}`,
        );

        let argumentsObject: unknown;

try {
  argumentsObject = JSON.parse(functionCall.arguments);
} catch {
  const result = {
    success: false as const,
    error: `Invalid JSON arguments for tool "${functionCall.name}"`,
  };

  state.addToolExecution({
    toolName: functionCall.name,
    arguments: functionCall.arguments,
    result,
  });

  console.log(
    `[Agent] Invalid JSON arguments for tool: ${functionCall.name}`,
  );

  return {
    type: "function_call_output" as const,
    call_id: functionCall.call_id,
    output: JSON.stringify(result),
  };
}

let result;

if (!this.toolPolicy.isAllowed(functionCall.name)) {
  result = {
    success: false as const,
    error: `Tool "${functionCall.name}" is not allowed`,
  };

  console.log(
    `[Agent] Tool blocked by policy: ${functionCall.name}`,
  );
} else {
  result = await this.toolExecutor.execute(
    functionCall.name,
    argumentsObject,
  );
}

        state.addToolExecution({
          toolName: functionCall.name,
          arguments: argumentsObject,
          result,
        });

        console.log(
          `[Agent] Tool result: ${JSON.stringify(result)}`,
        );

        return {
          type: "function_call_output" as const,
          call_id: functionCall.call_id,
          output: JSON.stringify(result),
        };
      }),
    );

    console.log(
      `[Agent] Completed ${toolOutputs.length} tool call(s)`,
    );

    console.log(
      "[Agent] Sending tool results back to LLM",
    );

    response = await this.llm.respond(
      toolOutputs,
      this.toolDefinitions,
      response.id,
    );
  }

  console.log("[Agent] Maximum iterations exceeded");

  const error = `Maximum agent iterations (${this.maxIterations}) exceeded`;

state.errors.push(error);

console.log(`[Agent] ${error}`);

return {
  answer: "The agent could not complete the request within the allowed number of steps.",
  iterations: state.iteration,
  toolsUsed: [
    ...new Set(
      state.toolExecutions.map(
        (execution) => execution.toolName,
      ),
    ),
  ],
  errors: state.errors,
};
}
}