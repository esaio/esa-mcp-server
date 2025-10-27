import { beforeEach, describe, expect, it, vi } from "vitest";
import type { createEsaClient } from "../../api_client/index.js";
import { getAttachment } from "../attachments.js";

// Mock global fetch
global.fetch = vi.fn();

describe("getAttachment", () => {
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

      await getAttachment(mockClient, {
        teamName: "test-team",
        url: "https://dl.esa.io/uploads/test/file.txt",
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

      await getAttachment(mockClient, {
        teamName: "test-team",
        url: "https://files.esa.io/uploads/test/file.txt",
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

      await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/file.txt",
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
  });

  describe("text file handling", () => {
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

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/file.txt",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: mockTextContent,
          },
        ],
      });
    });

    it("should return text content for text/html files", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";
      const mockHtmlContent = "<html><body>Hello</body></html>";

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/file.html", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("text/html"),
        },
        text: vi.fn().mockResolvedValue(mockHtmlContent),
      });

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/file.html",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: mockHtmlContent,
          },
        ],
      });
    });
  });

  describe("image file handling", () => {
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

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/image.jpg",
      });

      expect(result).toEqual({
        content: [
          {
            type: "image",
            data: mockImageBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        ],
      });
    });

    it("should return base64 image content for image/png", async () => {
      const mockSignedUrl = "https://s3.amazonaws.com/signed-url";
      const mockImageBuffer = Buffer.from("fake-png-data");

      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/image.png", mockSignedUrl]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue("image/png"),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockImageBuffer),
      });

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/image.png",
      });

      expect(result).toEqual({
        content: [
          {
            type: "image",
            data: mockImageBuffer.toString("base64"),
            mimeType: "image/png",
          },
        ],
      });
    });
  });

  describe("binary file handling", () => {
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

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/document.pdf",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Base64-encoded file (application/pdf):\n${mockPdfBuffer.toString("base64")}`,
          },
        ],
      });
    });
  });

  describe("error handling", () => {
    it("should return error when teamName is missing", async () => {
      const result = await getAttachment(mockClient, {
        teamName: "",
        url: "/uploads/test/file.txt",
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

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/file.txt",
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

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/file.txt",
      });

      expect(result.content[0]).toMatchObject({
        type: "text",
        text: "Error: No signed URL returned from API",
      });
    });

    it("should return error when file is not found", async () => {
      mockClient.GET.mockResolvedValue({
        data: {
          signed_urls: [["/uploads/test/file.txt", null]],
        },
        error: undefined,
        response: { ok: true, status: 200 } as Response,
      });

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/file.txt",
      });

      expect(result.content[0]).toMatchObject({
        type: "text",
        text: "Error: File not found or inaccessible",
      });
    });

    it("should return error when file fetch fails", async () => {
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

      const result = await getAttachment(mockClient, {
        teamName: "test-team",
        url: "/uploads/test/file.txt",
      });

      expect(result.content[0]).toMatchObject({
        type: "text",
        text: "Error: Failed to fetch file: 404",
      });
    });
  });
});
