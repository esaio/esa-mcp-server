import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import { formatToolError } from "../formatters/mcp-response.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";

export const getAttachmentsSchema = createSchemaWithTeamName({
  urls: z
    .array(z.string())
    .min(1, "At least one URL is required")
    .max(10, "Maximum 10 URLs allowed")
    .describe(
      "Array of attachment URLs (e.g., 'https://dl.esa.io/uploads/xxx/yyy.png') or file paths (e.g., '/uploads/xxx/yyy.png'). Maximum 10 URLs.",
    ),
});

/**
 * Extract file path from esa.io attachment URL or return path as-is
 * @param urlOrPath - Full URL or file path
 * @returns File path (e.g., '/uploads/xxx/yyy.png')
 */
function extractFilePath(urlOrPath: string): string {
  try {
    const url = new URL(urlOrPath);
    // Extract pathname from URLs like https://dl.esa.io/uploads/xxx/yyy.png
    // or https://files.esa.io/uploads/xxx/yyy.png
    if (
      url.hostname === "dl.esa.io" ||
      url.hostname === "files.esa.io" ||
      url.hostname.endsWith(".esa.io")
    ) {
      return url.pathname;
    }
    // If it's a URL but not from esa.io, return as-is (might be an error)
    return urlOrPath;
  } catch {
    // Not a valid URL, treat as file path
    return urlOrPath;
  }
}

/**
 * Determine if content type is text
 */
function isTextContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.startsWith("text/");
}

/**
 * Determine if content type is an image
 */
function isImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return (
    contentType.startsWith("image/") &&
    (contentType.includes("jpeg") ||
      contentType.includes("png") ||
      contentType.includes("gif") ||
      contentType.includes("webp"))
  );
}

/**
 * Process a single file: fetch and return content based on content type
 */
async function processSingleFile(
  originalUrl: string,
  signedUrl: string,
): Promise<CallToolResult["content"]> {
  try {
    const fileResponse = await fetch(signedUrl);
    if (!fileResponse.ok) {
      return [
        {
          type: "text",
          text: `Error fetching ${originalUrl}: HTTP ${fileResponse.status}`,
        },
      ];
    }

    const contentType = fileResponse.headers.get("content-type");

    // Handle text files
    if (isTextContentType(contentType)) {
      const textContent = await fileResponse.text();
      return [
        {
          type: "text",
          text: `File: ${originalUrl}\nContent-Type: ${contentType}\n\n${textContent}`,
        },
      ];
    }

    // Handle image files
    if (isImageContentType(contentType)) {
      const arrayBuffer = await fileResponse.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      return [
        {
          type: "text",
          text: `File: ${originalUrl}\nContent-Type: ${contentType}`,
        },
        {
          type: "image",
          data: base64Data,
          mimeType: contentType || "application/octet-stream",
        },
      ];
    }

    // Handle other binary files (PDF, etc.) as base64 text
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    return [
      {
        type: "text",
        text: `File: ${originalUrl}\nContent-Type: ${contentType}\nBase64-encoded content:\n${base64Data}`,
      },
    ];
  } catch (err) {
    return [
      {
        type: "text",
        text: `Error processing ${originalUrl}: ${err instanceof Error ? err.message : String(err)}`,
      },
    ];
  }
}

export async function getAttachments(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getAttachmentsSchema>,
): Promise<CallToolResult> {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }

    // Extract file paths from URLs or use paths as-is
    const filePaths = args.urls.map((url) => extractFilePath(url));

    // Get signed URLs from esa API (supports comma-separated URLs)
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/signed_urls",
      {
        params: {
          path: { team_name: args.teamName },
          query: { urls: filePaths.join(",") },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    // Extract signed URLs from response
    const signedUrls = data.signed_urls;
    if (!signedUrls || signedUrls.length === 0) {
      return formatToolError("No signed URLs returned from API");
    }

    // Process all files and collect results
    const allContent: CallToolResult["content"] = [];

    for (let i = 0; i < signedUrls.length; i++) {
      const [_originalPath, signedUrl] = signedUrls[i];
      const originalUrl = args.urls[i];

      if (!signedUrl) {
        allContent.push({
          type: "text",
          text: `File not found or inaccessible: ${originalUrl}`,
        });
        continue;
      }

      const fileContent = await processSingleFile(originalUrl, signedUrl);
      allContent.push(...fileContent);

      // Add separator between files (except for the last one)
      if (i < signedUrls.length - 1) {
        allContent.push({
          type: "text",
          text: "\n---\n",
        });
      }
    }

    return {
      content: allContent,
    };
  } catch (err) {
    return formatToolError(err);
  }
}
