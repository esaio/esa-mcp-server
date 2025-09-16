import type {
  CallToolResult,
  GetPromptResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";

function formatErrorText(error: unknown): string {
  return error instanceof Error
    ? `Error: ${error.message}`
    : typeof error === "number" && error !== null
      ? `Error: API Response(status: ${error})`
      : typeof error === "object" && error !== null
        ? `Error: ${JSON.stringify(error, null, 2)}`
        : `Error: ${String(error)}`;
}

export function formatToolResponse(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function formatResourceResponse(
  data: unknown,
  uri: string,
): ReadResourceResult {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function formatPromptResponse(message: string): GetPromptResult {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: message,
        },
      },
    ],
  };
}

export function formatToolError(error: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: formatErrorText(error),
      },
    ],
  };
}

export function formatResourceError(
  error: unknown,
  uri: string,
): ReadResourceResult {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: formatErrorText(error),
      },
    ],
  };
}

export function formatPromptError(error: unknown): GetPromptResult {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: formatErrorText(error),
        },
      },
    ],
  };
}
