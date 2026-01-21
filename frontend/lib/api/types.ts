/**
 * Type definitions for API service layer
 * Provides type safety for all API communication
 */

/**
 * Health check response from backend API
 */
export interface HealthResponse {
  status: "Healthy" | "Degraded" | "Unhealthy";
  timestamp: string;
  service: string;
}

/**
 * Standard API error response
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * API client configuration options
 */
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Request options for API calls
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ApiError).message === "string"
  );
}
