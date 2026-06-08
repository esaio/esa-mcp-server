import { config } from "./config/index.js";

const USAGE = `Usage: esa-mcp-server [options]

Options:
  -h, --help       Show this help message
  -v, --version    Show version number`;

export type CliAction =
  | { type: "continue" }
  | { output: string; status: number; type: "exit" };

export function handleCliArgs(args: string[]): CliAction {
  if (args.includes("--help") || args.includes("-h")) {
    return { type: "exit", status: 0, output: USAGE };
  }

  if (args.includes("--version") || args.includes("-v")) {
    return { type: "exit", status: 0, output: config.server.version };
  }

  const unknownOption = args.find((arg) => arg.startsWith("-"));
  if (unknownOption) {
    return {
      type: "exit",
      status: 1,
      output: `Unknown option: ${unknownOption}\n\n${USAGE}`,
    };
  }

  return { type: "continue" };
}
