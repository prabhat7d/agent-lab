import { AgentLoop } from "./AgentLoop.js";
import { AgentResult } from "./AgentResult.js";

export class Agent {
  constructor(private readonly loop: AgentLoop) {}

  async run(input: string): Promise<AgentResult> {
    return this.loop.run(input);
  }
}