import { describe, expect, it } from "vitest";
import {
  formatPromptError,
  formatPromptResponse,
  formatResourceError,
  formatResourceResponse,
  formatToolError,
  formatToolResponse,
} from "../mcp-response.js";

describe("response formatters", () => {
  describe("formatToolResponse", () => {
    it("should format data as JSON text content", () => {
      const data = { key: "value", count: 42 };
      const result = formatToolResponse(data);

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe("formatResourceResponse", () => {
    it("should format data as JSON resource with URI and mimeType", () => {
      const data = { resource: "data" };
      const uri = "esa://resource/123";
      const result = formatResourceResponse(data, uri);

      expect(result.contents[0]).toEqual({
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      });
    });
  });

  describe("formatPromptResponse", () => {
    it("should format message as user role content", () => {
      const message = "This is a prompt message";
      const result = formatPromptResponse(message);

      expect(result.messages[0]).toEqual({
        role: "user",
        content: {
          type: "text",
          text: message,
        },
      });
    });
  });
});

describe("error formatters", () => {
  it("should format Error instances consistently", () => {
    const error = new Error("test error");

    expect(formatToolError(error).content[0].text).toBe("Error: test error");
    expect(formatResourceError(error, "uri").contents[0].text).toBe(
      "Error: test error",
    );
    expect(formatPromptError(error).messages[0].content.text).toBe(
      "Error: test error",
    );
  });

  it("should format status codes as API responses", () => {
    const status = 404;

    expect(formatToolError(status).content[0].text).toBe(
      "Error: API Response(status: 404)",
    );
    expect(formatResourceError(status, "uri").contents[0].text).toBe(
      "Error: API Response(status: 404)",
    );
  });

  it("should format object errors as JSON strings", () => {
    const error = { code: "NOT_FOUND", message: "Resource not found" };
    const expectedText = `Error: ${JSON.stringify(error, null, 2)}`;

    expect(formatToolError(error).content[0].text).toBe(expectedText);
    expect(formatResourceError(error, "uri").contents[0].text).toBe(
      expectedText,
    );
    expect(formatPromptError(error).messages[0].content.text).toBe(
      expectedText,
    );
  });

  it("should maintain correct structure for each error formatter", () => {
    const error = new Error("test");
    const uri = "test://uri";

    const toolResult = formatToolError(error);
    expect(toolResult).toHaveProperty("content");
    expect(Array.isArray(toolResult.content)).toBe(true);

    const resourceResult = formatResourceError(error, uri);
    expect(resourceResult).toHaveProperty("contents");
    expect(resourceResult.contents[0].uri).toBe(uri);
    expect(resourceResult.contents[0].mimeType).toBe("application/json");

    const promptResult = formatPromptError(error);
    expect(promptResult).toHaveProperty("messages");
    expect(promptResult.messages[0].role).toBe("user");
  });
});
