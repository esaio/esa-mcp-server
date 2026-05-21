import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import {
  formatPromptError,
  formatPromptResponse,
} from "../formatters/mcp-response.js";
import type { components } from "../generated/api-types.js";
import { t } from "../i18n/index.js";

// 多言語化対応のために 関数化してスキーマを遅延定義している
export const createSummarizePostSchema = () =>
  z.object({
    teamName: z.string().describe(t("prompts.summarize_post.args.team_name")),
    postNumber: z
      .string()
      .describe(t("prompts.summarize_post.args.post_number")),
  });

export async function summarizePost(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<ReturnType<typeof createSummarizePostSchema>>,
) {
  const { teamName, postNumber: postNumberStr } = args;

  if (!teamName) {
    throw new MissingTeamNameError();
  }
  const postNumber = Number.parseInt(postNumberStr, 10);

  if (Number.isNaN(postNumber) || postNumber <= 0) {
    return formatPromptError("Post number must be a positive integer");
  }

  try {
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/posts/{post_number}",
      {
        params: {
          path: { team_name: teamName, post_number: postNumber },
        },
      },
    );

    if (error || !response.ok) {
      return formatPromptError(error || response.status);
    }

    const post: components["schemas"]["Post"] = data;

    let prompt = `Please summarize the following post:\n\n`;
    prompt += `Title: ${post.name}\n`;
    prompt += `URL: ${post.url}\n`;
    prompt += `Author: ${post.created_by.name}\n`;
    prompt += `Created: ${post.created_at}\n`;
    prompt += `Updated: ${post.updated_at}\n`;

    if (post.category) {
      prompt += `Category: ${post.category}\n`;
    }

    if (post.tags && post.tags.length > 0) {
      prompt += `Tags: ${post.tags.join(", ")}\n`;
    }

    prompt += "\n---\n\n";

    if (post.body_md) {
      prompt += `Content:\n${post.body_md}\n`;
    }

    return formatPromptResponse(prompt);
  } catch (error) {
    return formatPromptError(error);
  }
}
