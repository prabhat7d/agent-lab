export class ToolPolicy {
  constructor(
    private readonly allowedTools: Set<string>,
  ) {}

  isAllowed(toolName: string): boolean {
    return this.allowedTools.has(toolName);
  }
}