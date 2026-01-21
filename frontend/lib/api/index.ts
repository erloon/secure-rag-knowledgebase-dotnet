/**
 * API Service Layer
 *
 * Exports all API functionality for easy imports
 */

// Types
export type {
  ApiConfig,
  ApiError,
  ApiResponse,
  HealthResponse,
  HttpMethod,
  RequestOptions,
} from "./types";

export { isApiError } from "./types";

// API Client
export { ApiClient, createApiClient } from "./client";

// Health Service
export { HealthService, createHealthService } from "./health";
