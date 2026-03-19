"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ApiResponse,
  WorkoutLog,
  WorkoutLogCreate,
  ExerciseHistory,
} from "@/types";

export function useWorkoutLogs(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const qs = params.toString();

  return useQuery({
    queryKey: ["workoutLogs", startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<WorkoutLog[]>>(
        `/api/workouts/logs${qs ? `?${qs}` : ""}`
      );
      return res.data ?? [];
    },
  });
}

export function useCreateWorkoutLogs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: WorkoutLogCreate[]) => {
      const res = await apiFetch<ApiResponse<WorkoutLog[]>>(
        "/api/workouts/logs",
        {
          method: "POST",
          body: JSON.stringify({ entries }),
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutLogs"] });
    },
  });
}

export function useExerciseHistory(exerciseId: string | null) {
  return useQuery({
    queryKey: ["exerciseHistory", exerciseId],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<ExerciseHistory>>(
        `/api/workouts/logs/exercise/${exerciseId}/history`
      );
      return res.data;
    },
    enabled: !!exerciseId,
  });
}
