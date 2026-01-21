/**
 * Component tests for HealthButton
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HealthButton from "../HealthButton";

// Mock the health service
jest.mock("@/lib/api", () => ({
  createHealthService: jest.fn(),
}));

import { createHealthService } from "@/lib/api";

describe("HealthButton", () => {
  const mockHealthService = {
    checkHealth: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createHealthService as jest.Mock).mockReturnValue(mockHealthService);
  });

  describe("initial render", () => {
    it("should render button in idle state", () => {
      render(<HealthButton />);

      expect(screen.getByRole("button", { name: "Get Health Status" })).toBeInTheDocument();
    });

    it("should not show loading state initially", () => {
      render(<HealthButton />);

      expect(screen.queryByText("Checking health status...")).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should show loading indicator when checking health", async () => {
      const user = userEvent.setup();
      mockHealthService.checkHealth.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<HealthButton />);

      const button = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(button);

      expect(screen.getByText("Checking health status...")).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("should display health information on successful check", async () => {
      const user = userEvent.setup();
      const mockHealthData = {
        status: "Healthy",
        timestamp: "2025-01-21T10:30:00Z",
        service: "KbRag.Api",
      };

      mockHealthService.checkHealth.mockResolvedValueOnce(mockHealthData);

      render(<HealthButton />);

      const button = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Service Healthy")).toBeInTheDocument();
        expect(screen.getByText("KbRag.Api")).toBeInTheDocument();
      });
    });

    it("should show reset button after successful check", async () => {
      const user = userEvent.setup();
      const mockHealthData = {
        status: "Healthy",
        timestamp: "2025-01-21T10:30:00Z",
        service: "KbRag.Api",
      };

      mockHealthService.checkHealth.mockResolvedValueOnce(mockHealthData);

      render(<HealthButton />);

      const button = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
      });
    });
  });

  describe("error state", () => {
    it("should display error message when health check fails", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Failed to fetch");
      mockHealthService.checkHealth.mockRejectedValueOnce(mockError);

      render(<HealthButton />);

      const button = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Error:")).toBeInTheDocument();
        expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
      });
    });

    it("should display generic error for non-Error objects", async () => {
      const user = userEvent.setup();
      mockHealthService.checkHealth.mockRejectedValueOnce("Unknown error");

      render(<HealthButton />);

      const button = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Error:")).toBeInTheDocument();
        expect(screen.getByText("Failed to check health")).toBeInTheDocument();
      });
    });

    it("should show reset button after error", async () => {
      const user = userEvent.setup();
      mockHealthService.checkHealth.mockRejectedValueOnce(new Error("Network error"));

      render(<HealthButton />);

      const button = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
      });
    });
  });

  describe("reset functionality", () => {
    it("should reset to idle state when reset button is clicked", async () => {
      const user = userEvent.setup();
      const mockHealthData = {
        status: "Healthy",
        timestamp: "2025-01-21T10:30:00Z",
        service: "KbRag.Api",
      };

      mockHealthService.checkHealth.mockResolvedValueOnce(mockHealthData);

      render(<HealthButton />);

      // Click health check button
      const healthButton = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(healthButton);

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText("Service Healthy")).toBeInTheDocument();
      });

      // Click reset button
      const resetButton = screen.getByRole("button", { name: "Reset" });
      await user.click(resetButton);

      // Should return to idle state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Get Health Status" })).toBeInTheDocument();
        expect(screen.queryByText("Service Healthy")).not.toBeInTheDocument();
      });
    });

    it("should allow retry after error reset", async () => {
      const user = userEvent.setup();
      // First call fails, second succeeds
      mockHealthService.checkHealth
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          status: "Healthy",
          timestamp: "2025-01-21T10:30:00Z",
          service: "KbRag.Api",
        });

      render(<HealthButton />);

      // First attempt - fails
      const healthButton = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(healthButton);

      await waitFor(() => {
        expect(screen.getByText("Error:")).toBeInTheDocument();
      });

      // Reset
      const resetButton = screen.getByRole("button", { name: "Reset" });
      await user.click(resetButton);

      // Should return to idle state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Get Health Status" })).toBeInTheDocument();
      });

      // Second attempt - succeeds
      const healthButton2 = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(healthButton2);

      await waitFor(() => {
        expect(screen.getByText("Service Healthy")).toBeInTheDocument();
      });
    });
  });

  describe("health service integration", () => {
    it("should call createHealthService without arguments", async () => {
      const user = userEvent.setup();
      mockHealthService.checkHealth.mockResolvedValueOnce({
        status: "Healthy",
        timestamp: "2025-01-21T10:30:00Z",
        service: "KbRag.Api",
      });

      render(<HealthButton />);

      const button = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(button);

      expect(createHealthService).toHaveBeenCalledWith();
    });

    it("should call checkHealth method when button is clicked", async () => {
      const user = userEvent.setup();
      mockHealthService.checkHealth.mockResolvedValueOnce({
        status: "Healthy",
        timestamp: "2025-01-21T10:30:00Z",
        service: "KbRag.Api",
      });

      render(<HealthButton />);

      const button = screen.getByRole("button", { name: "Get Health Status" });
      await user.click(button);

      expect(mockHealthService.checkHealth).toHaveBeenCalled();
    });
  });
});
