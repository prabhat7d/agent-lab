import { ToolResult } from "../tools/ToolResult.js";

export type ToolExecution = {
  toolName: string;
  arguments: unknown;
  result: ToolResult;
};

export class AgentState {
  readonly userInput: string;

  iteration = 0;
  toolExecutions: ToolExecution[] = [];
  errors: string[] = [];
  finalResponse: string | null = null;

  constructor(userInput: string) {
    this.userInput = userInput;
  }

  addToolExecution(execution: ToolExecution): void {
    this.toolExecutions.push(execution);

    if (!execution.result.success) {
      this.errors.push(execution.result.error);
    }
  }

  setFinalResponse(response: string): void {
    this.finalResponse = response;
  }

  getToolsUsed(): string[] {
  return [
    ...new Set(
      this.toolExecutions.map(
        (execution) => execution.toolName,
      ),
    ),
  ];
}

  getSummary() {
    return {
      userInput: this.userInput,
      iterations: this.iteration,
      toolExecutions: this.toolExecutions,
      errors: this.errors,
      finalResponse: this.finalResponse,
    };
  }
}