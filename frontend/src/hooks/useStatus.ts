"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ApiResponse,
  DailyStatus,
  DailyStatusCreate,
  StatusReport,
  WeeklyReport,
} from "@/types";

export function useDailyStatuses(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const qs = params.toString();

  return useQuery({
    queryKey: ["dailyStatuses", startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<DailyStatus[]>>(
        `/api/status/daily${qs ? `?${qs}` : ""}`
      );
      return res.data ?? [];
    },
  });
}

export function useUpsertDailyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DailyStatusCreate) => {
      const res = await apiFetch<ApiResponse<DailyStatus>>(
        "/api/status/daily",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["statusReport"] });
    },
  });
}

export function useStatusReport(period: "weekly" | "monthly" = "weekly") {
  return useQuery({
    queryKey: ["statusReport", period],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<StatusReport>>(
        `/api/status/report?period=${period}`
      );
      return res.data;
    },
  });
}

export function useWeeklyAIReport() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch<ApiResponse<WeeklyReport>>(
        "/api/status/weekly-report"
      );
      return res.data;
    },
  });
}
