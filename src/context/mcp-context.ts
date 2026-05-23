import type { Logger } from "../logger/index.js";

export interface MCPContext {
  logger: Logger;
  [key: string]: unknown;
}
