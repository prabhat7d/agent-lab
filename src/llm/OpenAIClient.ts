import OpenAI from "openai";

export class OpenAIClient {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  async respond(
    input: OpenAI.Responses.ResponseInput,
    tools: OpenAI.Responses.Tool[],
    previousResponseId?: string,
  ) {
    return this.client.responses.create({
      model: "gpt-6-luna",
      input,
      tools,
      previous_response_id: previousResponseId,
    });
  }
}