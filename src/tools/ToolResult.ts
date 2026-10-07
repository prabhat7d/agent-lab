export type ToolResult =
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      error: string;
    };