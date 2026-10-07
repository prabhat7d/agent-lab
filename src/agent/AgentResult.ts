export type AgentResult = {
  answer: string;
  iterations: number;
  toolsUsed: string[];
  errors: string[];
};