import { beforeEach, describe, expect, it, vi } from "vitest";
import type { createEsaClient } from "../../api_client/index.js";
import { getAttachment } from "../attachments.js";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("getAttachment", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return base64-encoded image for small images", async () => {
    const signedUrl = "https://s3.amazonaws.com/bucket/image.png?signature=123";
    const imageData = "fake-image-data";
    const imageBuffer = Buffer.from(imageData);

    // Mock API response with signed URL
    mockClient.GET.mockResolvedValue({
      data: {
        signed_urls: [["/uploads/example/image.png", signedUrl]],
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    // Mock fetch response for image
    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === "content-type") return "image/png";
          if (name === "content-length") return String(imageBuffer.length);
          return null;
        },
      },
      arrayBuffer: async () => {
        const buffer = Buffer.from(imageData);
        return buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        );
      },
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "https://dl.esa.io/uploads/example/image.png",
    });

    expect(mockClient.GET).toHaveBeenCalledWith(
      "/v1/teams/{team_name}/signed_urls",
      {
        params: {
          path: { team_name: "test-team" },
          query: {
            urls: "/uploads/example/image.png",
            v: 2,
          },
        },
      },
    );

    expect(mockFetch).toHaveBeenCalledWith(signedUrl);

    expect(result).toEqual({
      content: [
        {
          type: "image",
          data: imageBuffer.toString("base64"),
          mimeType: "image/png",
        },
      ],
    });
  });

  it("should return signed URL for large images (over 30MB)", async () => {
    const signedUrl = "https://s3.amazonaws.com/bucket/large.png?signature=123";
    const largeSize = 35 * 1024 * 1024; // 35MB

    mockClient.GET.mockResolvedValue({
      data: {
        signed_urls: [["/uploads/example/large.png", signedUrl]],
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === "content-type") return "image/png";
          if (name === "content-length") return String(largeSize);
          return null;
        },
      },
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "/uploads/example/large.png",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: signedUrl,
        },
      ],
    });
  });

  it("should return signed URL for non-image files", async () => {
    const signedUrl = "https://s3.amazonaws.com/bucket/doc.pdf?signature=123";

    mockClient.GET.mockResolvedValue({
      data: {
        signed_urls: [["/uploads/example/doc.pdf", signedUrl]],
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === "content-type") return "application/pdf";
          if (name === "content-length") return "1024";
          return null;
        },
      },
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "https://files.esa.io/uploads/example/doc.pdf",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: signedUrl,
        },
      ],
    });
  });

  it("should handle file not found (null signed URL)", async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        signed_urls: [["/uploads/example/missing.png", null]],
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "/uploads/example/missing.png",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: File not found: /uploads/example/missing.png",
        },
      ],
    });
  });

  it("should handle fetch failure", async () => {
    const signedUrl = "https://s3.amazonaws.com/bucket/image.png?signature=123";

    mockClient.GET.mockResolvedValue({
      data: {
        signed_urls: [["/uploads/example/image.png", signedUrl]],
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "/uploads/example/image.png",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Failed to fetch attachment for /uploads/example/image.png: Failed to fetch attachment: 403 Forbidden",
        },
      ],
    });
  });

  it("should handle API errors", async () => {
    const mockError = { error: "not_found", message: "Team not found" };

    mockClient.GET.mockResolvedValue({
      data: undefined,
      error: mockError,
      response: {
        ok: false,
        status: 404,
      } as Response,
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "/uploads/example/image.png",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error: ${JSON.stringify(mockError, null, 2)}`,
        },
      ],
    });
  });

  it("should handle missing teamName", async () => {
    const result = await getAttachment(mockClient, {
      teamName: "",
      url: "/uploads/example/image.png",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error: Missing required parameter 'teamName'. Use esa_get_teams to list available teams, then retry with teamName specified.",
        },
      ],
    });

    expect(mockClient.GET).not.toHaveBeenCalled();
  });

  it("should support various image formats (jpeg, png, gif, webp)", async () => {
    const testCases = [
      { mimeType: "image/jpeg", url: "/image.jpg" },
      { mimeType: "image/png", url: "/image.png" },
      { mimeType: "image/gif", url: "/image.gif" },
      { mimeType: "image/webp", url: "/image.webp" },
    ];

    for (const { mimeType, url } of testCases) {
      vi.clearAllMocks();

      const signedUrl = `https://s3.amazonaws.com/bucket${url}?signature=123`;
      const imageData = "test-image";
      const imageBuffer = Buffer.from(imageData);

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [[url, signedUrl]],
        },
        error: undefined,
        response: {
          ok: true,
          status: 200,
        } as Response,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => {
            if (name === "content-type") return mimeType;
            if (name === "content-length") return String(imageBuffer.length);
            return null;
          },
        },
        arrayBuffer: async () => {
          const buffer = Buffer.from(imageData);
          return buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength,
          );
        },
      });

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url,
      });

      expect(result).toEqual({
        content: [
          {
            type: "image",
            data: imageBuffer.toString("base64"),
            mimeType,
          },
        ],
      });
    }
  });

  it("should return signed URL when forceSignedUrl is true", async () => {
    const signedUrl = "https://s3.amazonaws.com/bucket/image.png?signature=123";

    mockClient.GET.mockResolvedValue({
      data: {
        signed_urls: [["/uploads/example/image.png", signedUrl]],
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "/uploads/example/image.png",
      forceSignedUrl: true,
    });

    // Should not call fetch when forceSignedUrl is true
    expect(mockFetch).not.toHaveBeenCalled();

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: signedUrl,
        },
      ],
    });
  });

  it("should return base64 for images under 30MB", async () => {
    const signedUrl = "https://s3.amazonaws.com/bucket/image.png?signature=123";
    const imageData = "a".repeat(25 * 1024 * 1024); // 25MB
    const imageBuffer = Buffer.from(imageData);

    mockClient.GET.mockResolvedValue({
      data: {
        signed_urls: [["/uploads/example/image.png", signedUrl]],
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === "content-type") return "image/png";
          if (name === "content-length") return String(imageBuffer.length);
          return null;
        },
      },
      arrayBuffer: async () => {
        const buffer = Buffer.from(imageData);
        return buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        );
      },
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "/uploads/example/image.png",
    });

    expect(result).toEqual({
      content: [
        {
          type: "image",
          data: imageBuffer.toString("base64"),
          mimeType: "image/png",
        },
      ],
    });
  });

  it("should return signed URL for unsupported image formats", async () => {
    const signedUrl = "https://s3.amazonaws.com/bucket/image.svg?signature=123";
    const imageBuffer = Buffer.from("svg-data");

    mockClient.GET.mockResolvedValue({
      data: {
        signed_urls: [["/uploads/example/image.svg", signedUrl]],
      },
      error: undefined,
      response: {
        ok: true,
        status: 200,
      } as Response,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === "content-type") return "image/svg+xml";
          if (name === "content-length") return String(imageBuffer.length);
          return null;
        },
      },
    });

    const result = await getAttachment(mockClient, {
      teamName: "test-team",
      url: "/uploads/example/image.svg",
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: signedUrl,
        },
      ],
    });
  });
});
