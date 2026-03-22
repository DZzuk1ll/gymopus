"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, AnalysisResult } from "@/types";

export function useAnalyzeInsights() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch<ApiResponse<AnalysisResult>>(
        "/api/insights/analyze",
        { method: "POST" }
      );
      if (!res.success) throw new Error(res.error ?? "分析失败");
      return res.data!;
    },
  });
}
