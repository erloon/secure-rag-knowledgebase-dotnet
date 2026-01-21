"use client";

import { useState } from "react";
import { createHealthService } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type HealthStatus = "idle" | "loading" | "success" | "error";

interface HealthData {
  status: string;
  timestamp: string;
  service: string;
}

export default function HealthButton() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("idle");
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setHealthStatus("loading");
    setError(null);

    try {
      const healthService = createHealthService();
      const data = await healthService.checkHealth();
      setHealthData(data);
      setHealthStatus("success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to check health";
      setError(errorMessage);
      setHealthStatus("error");
    }
  };

  const handleReset = () => {
    setHealthStatus("idle");
    setHealthData(null);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {healthStatus === "idle" && (
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Get Health Status
        </button>
      )}

      {healthStatus === "loading" && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Checking health status...</span>
        </div>
      )}

      {healthStatus === "success" && healthData && (
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div className="text-green-700">
            <span className="font-medium">Service Healthy</span>
            <span className="mx-1">-</span>
            <span>{healthData.service}</span>
          </div>
          <button
            onClick={handleReset}
            className="ml-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {healthStatus === "error" && (
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-600" />
          <div className="text-red-700">
            <span className="font-medium">Error:</span>
            <span className="ml-1">{error}</span>
          </div>
          <button
            onClick={handleReset}
            className="ml-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
