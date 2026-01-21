/**
 * Unit tests for HealthService
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { HealthService, createHealthService } from "../health";
import { ApiClient, createApiClient } from "../client";

// Mock the ApiClient module
jest.mock("../client", () => ({
  ApiClient: jest.fn(),
  createApiClient: jest.fn(),
}));

describe("HealthService", () => {
  let healthService: HealthService;
  let mockApiClient: {
    get: jest.Mock;
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock API client
    mockApiClient = {
      get: jest.fn(),
    };

    // Mock ApiClient constructor
    (ApiClient as jest.Mock).mockImplementation(function () {
      return mockApiClient as unknown as ApiClient;
    });

    healthService = new HealthService(mockApiClient as unknown as ApiClient);
  });

  describe("checkHealth", () => {
    it("should return health data on successful check", async () => {
      const mockHealthResponse = {
        data: {
          status: "Healthy",
          timestamp: "2025-01-21T10:30:00Z",
          service: "KbRag.Api",
        },
        status: 200,
        statusText: "OK",
      };

      mockApiClient.get.mockResolvedValueOnce(mockHealthResponse);

      const result = await healthService.checkHealth();

      expect(mockApiClient.get).toHaveBeenCalledWith("/health");
      expect(result).toEqual({
        status: "Healthy",
        timestamp: "2025-01-21T10:30:00Z",
        service: "KbRag.Api",
      });
    });

    it("should return Degraded status when service is degraded", async () => {
      const mockHealthResponse = {
        data: {
          status: "Degraded",
          timestamp: "2025-01-21T10:30:00Z",
          service: "KbRag.Api",
        },
        status: 200,
        statusText: "OK",
      };

      mockApiClient.get.mockResolvedValueOnce(mockHealthResponse);

      const result = await healthService.checkHealth();

      expect(result.status).toBe("Degraded");
    });

    it("should return Unhealthy status when service is unhealthy", async () => {
      const mockHealthResponse = {
        data: {
          status: "Unhealthy",
          timestamp: "2025-01-21T10:30:00Z",
          service: "KbRag.Api",
        },
        status: 503,
        statusText: "Service Unavailable",
      };

      mockApiClient.get.mockResolvedValueOnce(mockHealthResponse);

      const result = await healthService.checkHealth();

      expect(result.status).toBe("Unhealthy");
    });

    it("should handle errors when backend is unavailable", async () => {
      const mockError = {
        message: "Failed to fetch",
        statusCode: 503,
      };

      mockApiClient.get.mockRejectedValueOnce(mockError);

      await expect(healthService.checkHealth()).rejects.toEqual(mockError);
      expect(mockApiClient.get).toHaveBeenCalledWith("/health");
    });

    it("should handle network errors", async () => {
      const mockError = {
        message: "Network error",
      };

      mockApiClient.get.mockRejectedValueOnce(mockError);

      await expect(healthService.checkHealth()).rejects.toEqual(mockError);
    });

    it("should handle timeout errors", async () => {
      const mockError = {
        message: "Request timeout",
        statusCode: 408,
      };

      mockApiClient.get.mockRejectedValueOnce(mockError);

      await expect(healthService.checkHealth()).rejects.toEqual(mockError);
    });
  });
});

describe("createHealthService factory", () => {
  it("should create HealthService instance with API URL", () => {
    const apiUrl = "http://localhost:3000";
    const service = createHealthService(apiUrl);

    expect(service).toBeInstanceOf(HealthService);
    expect(createApiClient).toHaveBeenCalledWith(apiUrl);
  });

  it("should create HealthService instance with different API URL", () => {
    const apiUrl = "http://api.example.com";
    const service = createHealthService(apiUrl);

    expect(service).toBeInstanceOf(HealthService);
    expect(createApiClient).toHaveBeenCalledWith(apiUrl);
  });

  it("should create HealthService instance without API URL", () => {
    const service = createHealthService();

    expect(service).toBeInstanceOf(HealthService);
    expect(createApiClient).toHaveBeenCalledWith(undefined);
  });
});
