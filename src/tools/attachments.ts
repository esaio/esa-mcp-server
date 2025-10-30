import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { createEsaClient } from "../api_client/index.js";
import { MissingTeamNameError } from "../errors/missing-team-name-error.js";
import { formatToolError } from "../formatters/mcp-response.js";
import { createSchemaWithTeamName } from "../schemas/team-name-schema.js";

// Maximum file size for base64 encoding (30MB)
const MAX_IMAGE_SIZE = 30 * 1024 * 1024;

// Supported image MIME types for base64 encoding
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const getAttachmentsSchema = createSchemaWithTeamName({
  urls: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe(
      "Array of attachment URLs (up to 10). Can be full URLs (https://files.esa.io/..., https://dl.esa.io/...) or paths (/uploads/...). Note: When multiple URLs are provided, signed URLs are automatically returned for all files.",
    ),
  forceSignedUrl: z
    .boolean()
    .optional()
    .describe(
      "If true, always return signed URLs instead of base64-encoded images. Default is false. This parameter is automatically set to true when multiple URLs are provided.",
    ),
});

/**
 * Extracts the path from a full URL or returns the input if it's already a path
 */
function normalizeUrl(url: string): string {
  // If it's already a path (starts with /), return as-is
  if (url.startsWith("/")) {
    return url;
  }

  try {
    // Try to parse as URL and extract pathname
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, assume it's already a path
    return url;
  }
}

/**
 * Checks if the MIME type is a supported image format
 */
function isSupportedImage(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(
    mimeType as (typeof SUPPORTED_IMAGE_TYPES)[number],
  );
}

/**
 * Fetches content and returns base64-encoded data if it's a supported image under size limit
 */
async function fetchAttachment(
  signedUrl: string,
  forceSignedUrl: boolean,
): Promise<
  | { type: "image"; data: string; mimeType: string }
  | { type: "text"; text: string }
> {
  // If forceSignedUrl is true, always return signed URL
  if (forceSignedUrl) {
    return {
      type: "text" as const,
      text: signedUrl,
    };
  }

  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch attachment: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const contentLength = response.headers.get("content-length");
  const size = contentLength ? Number.parseInt(contentLength, 10) : 0;

  // Check if it's a supported image and within size limit
  if (isSupportedImage(contentType) && size > 0 && size <= MAX_IMAGE_SIZE) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    return {
      type: "image" as const,
      data: base64,
      mimeType: contentType,
    };
  }

  // For non-images or oversized images, return the signed URL
  return {
    type: "text" as const,
    text: signedUrl,
  };
}

export async function getAttachments(
  client: ReturnType<typeof createEsaClient>,
  args: z.infer<typeof getAttachmentsSchema>,
): Promise<CallToolResult> {
  try {
    if (!args.teamName) {
      throw new MissingTeamNameError();
    }

    // Normalize URLs to paths
    const normalizedUrls = args.urls.map(normalizeUrl);

    // Get signed URLs from esa API
    const { data, error, response } = await client.GET(
      "/v1/teams/{team_name}/signed_urls",
      {
        params: {
          path: { team_name: args.teamName },
          query: {
            urls: normalizedUrls.join(","),
            v: 2,
          },
        },
      },
    );

    if (error || !response.ok) {
      return formatToolError(error || response.status);
    }

    if (!data.signed_urls || data.signed_urls.length === 0) {
      throw new Error("No signed URLs returned from API");
    }

    // Process each signed URL
    const content: Array<
      | { type: "image"; data: string; mimeType: string }
      | { type: "text"; text: string }
    > = [];

    // Force signed URLs when multiple files are requested
    const forceSignedUrl =
      args.urls.length > 1 || (args.forceSignedUrl ?? false);

    for (const [originalUrl, signedUrl] of data.signed_urls) {
      if (signedUrl === null) {
        throw new Error(`File not found: ${originalUrl}`);
      }

      try {
        const result = await fetchAttachment(signedUrl, forceSignedUrl);
        content.push(result);
      } catch (err) {
        throw new Error(
          `Failed to fetch attachment for ${originalUrl}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return { content };
  } catch (err) {
    return formatToolError(err);
  }
}
