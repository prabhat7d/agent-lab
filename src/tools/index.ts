import { ToolRegistry } from "./ToolRegistry.js";
import { calculator } from "./calculator.js";

export const toolRegistry = new ToolRegistry();

toolRegistry.register(calculator);