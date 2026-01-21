/**
 * Health service for checking backend API health status
 */

import type { HealthResponse } from "./types";
import { createApiClient, type ApiClient as ApiClientType } from "./client";

/**
 * Health Service class
 */
export class HealthService {
  private client: ApiClientType;

  constructor(client: ApiClientType) {
    this.client = client;
  }

  /**
   * Check the health status of the backend API
   */
  async checkHealth(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>("/health");
    return response.data;
  }
}

/**
 * Factory function to create a HealthService instance
 * Uses createApiClient which falls back to BASE_URL from environment variable
 */
export function createHealthService(apiUrl?: string): HealthService {
  const client = createApiClient(apiUrl);
  return new HealthService(client);
}
