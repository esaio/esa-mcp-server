import { beforeEach, describe, expect, it, vi } from "vitest";
import type { createEsaClient } from "../../api_client/index.js";
import { getAttachments } from "../attachments.js";

// Mock global fetch
global.fetch = vi.fn();

describe("getAttachments", () => {
  const mockClient = {
    GET: vi.fn(),
  } as unknown as ReturnType<typeof createEsaClient> & {
    GET: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("URL path extraction", () => {
    it("should extract path from https://dl.esa.io URL", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/file.txt", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("text/plain"),
        },
        text: vi.fn().mockResolvedValue("test content"),
      });

      await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["https://dl.esa.io/uploads/test/file.txt"],
      });

      expect(mockClient.GET).toHaveBeenCalledWith(
        "/v1/teams/{team_name}/signed_urls",
        {
          params: {
            path: { team_name: "test-team" },
            query: { urls: "/uploads/test/file.txt" },
          },
        },
      );
    });

    it("should extract path from https://files.esa.io URL", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/file.txt", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("text/plain"),
        },
        text: vi.fn().mockResolvedValue("test content"),
      });

      await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["https://files.esa.io/uploads/test/file.txt"],
      });

      expect(mockClient.GET).toHaveBeenCalledWith(
        "/v1/teams/{team_name}/signed_urls",
        {
          params: {
            path: { team_name: "test-team" },
            query: { urls: "/uploads/test/file.txt" },
          },
        },
      );
    });

    it("should use path as-is when not a URL", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/file.txt", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("text/plain"),
        },
        text: vi.fn().mockResolvedValue("test content"),
      });

      await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file.txt"],
      });

      expect(mockClient.GET).toHaveBeenCalledWith(
        "/v1/teams/{team_name}/signed_urls",
        {
          params: {
            path: { team_name: "test-team" },
            query: { urls: "/uploads/test/file.txt" },
          },
        },
      );
    });

    it("should handle multiple URLs with comma-separated paths", async () => {
      const mockSignedUrl1 = "https://s3.amazonaws.com/signed-url-1";
      const mockSignedUrl2 = "https://s3.amazonaws.com/signed-url-2";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [
            ["/uploads/test/file1.txt", mockSignedUrl1],
            ["/uploads/test/file2.txt", mockSignedUrl2],
          ],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("text/plain"),
          },
          text: vi.fn().mockResolvedValue("content 1"),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("text/plain"),
          },
          text: vi.fn().mockResolvedValue("content 2"),
        });

      await getAttachments(mockClient, {
        teamName: "test-team",
        urls: [
          "https://dl.esa.io/uploads/test/file1.txt",
          "https://dl.esa.io/uploads/test/file2.txt",
        ],
      });

      expect(mockClient.GET).toHaveBeenCalledWith(
        "/v1/teams/{team_name}/signed_urls",
        {
          params: {
            path: { team_name: "test-team" },
            query: { urls: "/uploads/test/file1.txt,/uploads/test/file2.txt" },
          },
        },
      );
    });
  });

  describe("single file handling", () => {
    it("should return text content for text/plain files", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";
      const mockTextContent = "Hello, world!";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/file.txt", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("text/plain"),
        },
        text: vi.fn().mockResolvedValue(mockTextContent),
      });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file.txt"],
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toMatchObject({
        type: "text",
      });
      expect(result.content[0].text).toContain(mockTextContent);
    });

    it("should return base64 image content for image/jpeg", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";
      const mockImageBuffer = Buffer.from("fake-image-data");

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/image.jpg", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("image/jpeg"),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
      });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/image.jpg"],
      });

      expect(result.content).toHaveLength(2); // text header + image
      expect(result.content[0]).toMatchObject({
        type: "text",
      });
      expect(result.content[1]).toMatchObject({
        type: "image",
        data: mockImageBuffer.toString("base64"),
        mimeType: "image/jpeg",
      });
    });

    it("should return base64 text for PDF files", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";
      const mockPdfBuffer = Buffer.from("fake-pdf-data");

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/document.pdf", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("application/pdf"),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockPdfBuffer),
      });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/document.pdf"],
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toMatchObject({
        type: "text",
      });
      expect(result.content[0].text).toContain(
        mockPdfBuffer.toString("base64"),
      );
    });
  });

  describe("multiple files handling", () => {
    it("should handle multiple files with separator", async () => {
      const mockSignedUrl1 = "https://s3.amazonaws.com/signed-url-1";
      const mockSignedUrl2 = "https://s3.amazonaws.com/signed-url-2";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [
            ["/uploads/test/file1.txt", mockSignedUrl1],
            ["/uploads/test/file2.txt", mockSignedUrl2],
          ],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("text/plain"),
          },
          text: vi.fn().mockResolvedValue("content 1"),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("text/plain"),
          },
          text: vi.fn().mockResolvedValue("content 2"),
        });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file1.txt", "/uploads/test/file2.txt"],
      });

      expect(result.content).toHaveLength(3); // file1 + separator + file2
      expect(result.content[0].text).toContain("content 1");
      expect(result.content[1].text).toContain("---");
      expect(result.content[2].text).toContain("content 2");
    });

    it("should handle mixed file types (text and image)", async () => {
      const mockSignedUrl1 = "https://s3.amazonaws.com/signed-url-1";
      const mockSignedUrl2 = "https://s3.amazonaws.com/signed-url-2";
      const mockImageBuffer = Buffer.from("fake-image-data");

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [
            ["/uploads/test/file.txt", mockSignedUrl1],
            ["/uploads/test/image.png", mockSignedUrl2],
          ],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("text/plain"),
          },
          text: vi.fn().mockResolvedValue("text content"),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("image/png"),
          },
          arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
        });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file.txt", "/uploads/test/image.png"],
      });

      // text file (1) + separator (1) + image header (1) + image (1)
      expect(result.content.length).toBeGreaterThanOrEqual(4);
      expect(result.content[0].text).toContain("text content");
      expect(result.content.some((c) => c.type === "image")).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should return error when teamName is missing", async () => {
      const result = await getAttachments(mockClient, {
        teamName: "",
        urls: ["/uploads/test/file.txt"],
      });

      expect(result.content[0]).toMatchObject({
        type: "text",
      });
      expect(result.content[0].text).toContain("Error");
    });

    it("should return error when API request fails", async () => {
      mockClient.GET.mockResolvedValue({
        data: undefined,
        error: { message: "API Error" },
        response: { ok: false, status: 500 } as Response,
      });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file.txt"],
      });

      expect(result.content[0]).toMatchObject({
        type: "text",
      });
      expect(result.content[0].text).toContain("Error");
    });

    it("should return error when no signed URL is returned", async () => {
      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file.txt"],
      });

      expect(result.content[0]).toMatchObject({
        type: "text",
        text: "Error: No signed URLs returned from API",
      });
    });

    it("should handle file not found gracefully", async () => {
      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/file.txt", null]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file.txt"],
      });

      expect(result.content[0]).toMatchObject({
        type: "text",
      });
      expect(result.content[0].text).toContain(
        "File not found or inaccessible",
      );
    });

    it("should handle file fetch failure gracefully", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/file.txt", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file.txt"],
      });

      expect(result.content[0]).toMatchObject({
        type: "text",
      });
      expect(result.content[0].text).toContain("Error fetching");
      expect(result.content[0].text).toContain("404");
    });

    it("should handle partial failures in multiple files", async () => {
      const mockSignedUrl1 = "https://s3.amazonaws.com/signed-url-1";
      const mockSignedUrl2 = "https://s3.amazonaws.com/signed-url-2";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [
            ["/uploads/test/file1.txt", mockSignedUrl1],
            ["/uploads/test/file2.txt", mockSignedUrl2],
          ],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn().mockReturnValue("text/plain"),
          },
          text: vi.fn().mockResolvedValue("success content"),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const result = await getAttachments(mockClient, {
        teamName: "test-team",
        urls: ["/uploads/test/file1.txt", "/uploads/test/file2.txt"],
      });

      expect(result.content.length).toBeGreaterThanOrEqual(3);
      expect(result.content[0].text).toContain("success content");
      expect(result.content[2].text).toContain("Error fetching");
    });
  });
});
