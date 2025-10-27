import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import { formatToolError } from "../formatters/mcp-response.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";

export const getAttachmentSchema = createSchemaWithTeamName({
  url: z
    .string()
    .describe(
      "The attachment URL (e.g., 'https://dl.esa.io/uploads/xxx/yyy.png') or file path (e.g., '/uploads/xxx/yyy.png')",
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

export async function getAttachment(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getAttachmentSchema>,
): Promise<CallToolResult> {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }

    // Extract file path from URL or use path as-is
    const filePath = extractFilePath(args.url);

    // Get signed URL from esa API
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/signed_urls",
      {
        params: {
          path: { team_name: args.teamName },
          query: { urls: filePath },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    // Extract signed URL from response
    const signedUrls = data.signed_urls;
    if (!signedUrls || signedUrls.length === 0) {
      return formatToolError("No signed URL returned from API");
    }

    const [_originalPath, signedUrl] = signedUrls[0];
    if (!signedUrl) {
      return formatToolError("File not found or inaccessible");
    }

    // Fetch the actual file content
    const fileResponse = await fetch(signedUrl);
    if (!fileResponse.ok) {
      return formatToolError(`Failed to fetch file: ${fileResponse.status}`);
    }

    const contentType = fileResponse.headers.get("content-type");

    // Handle text files
    if (isTextContentType(contentType)) {
      const textContent = await fileResponse.text();
      return {
        content: [
          {
            type: "text",
            text: textContent,
          },
        ],
      };
    }

    // Handle image files
    if (isImageContentType(contentType)) {
      const arrayBuffer = await fileResponse.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      return {
        content: [
          {
            type: "image",
            data: base64Data,
            mimeType: contentType || "application/octet-stream",
          },
        ],
      };
    }

    // Handle other binary files (PDF, etc.) as base64 text
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    return {
      content: [
        {
          type: "text",
          text: `Base64-encoded file (${contentType || "unknown type"}):\n${base64Data}`,
        },
      ],
    };
  } catch (err) {
    return formatToolError(err);
  }
}
