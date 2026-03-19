"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ApiResponse,
  MealLog,
  MealLogCreate,
  DietAnalysis,
  MealPlan,
} from "@/types";

export function useMealLogs(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const qs = params.toString();

  return useQuery({
    queryKey: ["mealLogs", startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<MealLog[]>>(
        `/api/meals/logs${qs ? `?${qs}` : ""}`
      );
      return res.data ?? [];
    },
  });
}

export function useCreateMealLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MealLogCreate) => {
      const res = await apiFetch<ApiResponse<MealLog>>("/api/meals/logs", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealLogs"] });
    },
  });
}

export function useAnalyzeDiet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MealLogCreate) => {
      const res = await apiFetch<ApiResponse<DietAnalysis>>(
        "/api/meals/analyze",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealLogs"] });
    },
  });
}

export function useGenerateMealPlan() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch<ApiResponse<MealPlan>>(
        "/api/meals/generate",
        { method: "POST" }
      );
      return res.data;
    },
  });
}
