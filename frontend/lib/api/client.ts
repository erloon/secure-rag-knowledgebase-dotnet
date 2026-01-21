/**
 * API Client for handling HTTP communication with the backend
 * Provides generic methods for common HTTP operations with timeout and cancellation support
 */

import type {
  ApiConfig,
  ApiError,
  ApiResponse,
  HttpMethod,
  RequestOptions,
} from "./types";

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5221";

/**
 * API Client class for making HTTP requests
 */
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.defaultTimeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...config.headers,
    };
  }

  /**
   * Generic HTTP request method with timeout and cancellation support
   */
  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout ?? this.defaultTimeout);

    // Allow external signal to abort the request
    if (options?.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.defaultHeaders, ...options?.headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const error: ApiError = {
          message: errorData.message || "An error occurred",
          statusCode: response.status,
          code: errorData.code,
        };
        throw error;
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw { message: "Request timeout", statusCode: 408 } as ApiError;
        }
        throw { message: error.message } as ApiError;
      }

      throw error;
    }
  }

  /**
   * Perform GET request
   */
  async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  /**
   * Perform POST request
   */
  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  /**
   * Perform PUT request
   */
  async put<T>(path: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body, options);
  }

  /**
   * Perform DELETE request
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  /**
   * Perform PATCH request
   */
  async patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }
}

/**
 * Factory function to create an API client instance
 * Uses BASE_URL from environment variable if no baseUrl is provided
 */
export function createApiClient(baseUrl?: string, config?: Partial<ApiConfig>): ApiClient {
  return new ApiClient({
    baseUrl: baseUrl ?? BASE_URL,
    timeout: config?.timeout,
    headers: config?.headers,
  });
}
