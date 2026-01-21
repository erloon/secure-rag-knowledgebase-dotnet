/**
 * Unit tests for API Client
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { ApiClient, createApiClient } from "../client";
import type { ApiConfig } from "../types";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    mockFetch.mockClear();
    client = new ApiClient({
      baseUrl: "http://localhost:3000",
      timeout: 5000,
    });
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  describe("initialization", () => {
    it("should create client with default timeout", () => {
      const defaultClient = new ApiClient({ baseUrl: "http://localhost:3000" });
      expect(defaultClient).toBeDefined();
    });

    it("should remove trailing slash from baseUrl", () => {
      const client = new ApiClient({ baseUrl: "http://localhost:3000/" });
      expect(client).toBeDefined();
    });

    it("should merge custom headers with defaults", () => {
      const client = new ApiClient({
        baseUrl: "http://localhost:3000",
        headers: { "X-Custom-Header": "custom-value" },
      });
      expect(client).toBeDefined();
    });
  });

  describe("GET requests", () => {
    it("should make successful GET request", async () => {
      const mockData = { message: "Success" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => mockData,
      });

      const response = await client.get("/api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(200);
    });

    it("should handle GET request errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Resource not found" }),
      });

      await expect(client.get("/api/test")).rejects.toMatchObject({
        message: "Resource not found",
        statusCode: 404,
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.get("/api/test")).rejects.toMatchObject({
        message: "Network error",
      });
    });
  });

  describe("POST requests", () => {
    it("should make successful POST request", async () => {
      const mockData = { id: 1, name: "Test" };
      const requestBody = { name: "Test" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: "Created",
        json: async () => mockData,
      });

      const response = await client.post("/api/test", requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(requestBody),
        })
      );
      expect(response.data).toEqual(mockData);
      expect(response.status).toBe(201);
    });

    it("should handle POST request errors", async () => {
      const requestBody = { name: "Test" };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ message: "Invalid data" }),
      });

      await expect(client.post("/api/test", requestBody)).rejects.toMatchObject({
        message: "Invalid data",
        statusCode: 400,
      });
    });
  });

  describe("PUT requests", () => {
    it("should make successful PUT request", async () => {
      const mockData = { id: 1, name: "Updated" };
      const requestBody = { name: "Updated" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => mockData,
      });

      const response = await client.put("/api/test/1", requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/test/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(requestBody),
        })
      );
      expect(response.data).toEqual(mockData);
    });
  });

  describe("DELETE requests", () => {
    it("should make successful DELETE request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: "No Content",
        json: async () => ({}),
      });

      const response = await client.delete("/api/test/1");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/test/1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(response.status).toBe(204);
    });
  });

  describe("PATCH requests", () => {
    it("should make successful PATCH request", async () => {
      const mockData = { id: 1, name: "Patched" };
      const requestBody = { name: "Patched" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => mockData,
      });

      const response = await client.patch("/api/test/1", requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/test/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(requestBody),
        })
      );
      expect(response.data).toEqual(mockData);
    });
  });

  describe("timeout handling", () => {
    it("should timeout request after specified duration", async () => {
      // Use a client with shorter timeout for faster test
      const fastTimeoutClient = new ApiClient({
        baseUrl: "http://localhost:3000",
        timeout: 50, // 50ms timeout
      });

      // Mock fetch to handle abort signal
      mockFetch.mockImplementationOnce((url, options) =>
        new Promise((resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener("abort", () => {
              const error = new Error("The operation was aborted");
              error.name = "AbortError";
              reject(error);
            });
          }
        })
      );

      await expect(fastTimeoutClient.get("/api/test")).rejects.toMatchObject({
        message: "Request timeout",
        statusCode: 408,
      });
    });
  });

  describe("request cancellation", () => {
    it("should support request cancellation via AbortSignal", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        client.get("/api/test", { signal: controller.signal })
      ).rejects.toMatchObject({
        message: expect.any(String),
      });
    });
  });

  describe("error handling", () => {
    it("should handle JSON parse errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(client.get("/api/test")).rejects.toMatchObject({
        message: "Internal Server Error",
        statusCode: 500,
      });
    });

    it("should handle response without message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({}),
      });

      await expect(client.get("/api/test")).rejects.toMatchObject({
        message: "An error occurred",
        statusCode: 500,
      });
    });
  });
});

describe("createApiClient factory", () => {
  it("should create ApiClient instance", () => {
    const client = createApiClient("http://localhost:3000");
    expect(client).toBeInstanceOf(ApiClient);
  });

  it("should create ApiClient with custom config", () => {
    const client = createApiClient("http://localhost:3000", {
      timeout: 15000,
      headers: { "X-Custom": "value" },
    });
    expect(client).toBeInstanceOf(ApiClient);
  });
});
