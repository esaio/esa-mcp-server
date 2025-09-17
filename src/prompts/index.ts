import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import { withContext } from "../api_client/with-context.js";
import type { MCPContext } from "../context/mcp-context.js";
import { t } from "../i18n/index.js";
import { createSummarizePostSchema, summarizePost } from "./summarize-post.js";

export function setupPrompts(server: McpServer, context: MCPContext): void {
  console.error("Setting up MCP prompts...");
  // NOTE: Streamable HTTP transport では ユーザーの LANG 設定に応じて i18next の lang 設定を変える
  server.registerPrompt(
    "esa_summarize_post",
    {
      title: t("prompts.summarize_post.title"),
      description: t("prompts.summarize_post.description"),
      argsSchema: createSummarizePostSchema().shape,
    },
    async (params: z.infer<ReturnType<typeof createSummarizePostSchema>>) =>
      withContext(context, summarizePost, params),
  );
}
