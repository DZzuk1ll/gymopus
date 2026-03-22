"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, TrainingPlan, WorkoutPlan } from "@/types";

export function useTrainingPlans(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["trainingPlans", status],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<TrainingPlan[]>>(
        `/api/training-plans${params}`
      );
      return res.data ?? [];
    },
  });
}

export function useActivePlan() {
  return useQuery({
    queryKey: ["trainingPlans", "active"],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<TrainingPlan[]>>(
        "/api/training-plans?status=active"
      );
      return res.data?.[0] ?? null;
    },
  });
}

export function useTrainingPlan(id: string | null) {
  return useQuery({
    queryKey: ["trainingPlan", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiFetch<ApiResponse<TrainingPlan>>(
        `/api/training-plans/${id}`
      );
      return res.data ?? null;
    },
    enabled: !!id,
  });
}

export function useSavePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: {
      plan_name: string;
      description: string;
      days_per_week: number;
      days: unknown[];
      methodology_notes?: string | null;
      warnings?: string[];
      constraints?: string | null;
      source?: string;
    }) => {
      const res = await apiFetch<ApiResponse<TrainingPlan>>(
        "/api/training-plans",
        { method: "POST", body: JSON.stringify(plan) }
      );
      if (!res.success) throw new Error(res.error ?? "保存失败");
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Record<string, unknown>) => {
      const res = await apiFetch<ApiResponse<TrainingPlan>>(
        `/api/training-plans/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
      );
      if (!res.success) throw new Error(res.error ?? "更新失败");
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPlan"] });
    },
  });
}

export function useActivatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<ApiResponse<TrainingPlan>>(
        `/api/training-plans/${id}/activate`,
        { method: "POST" }
      );
      if (!res.success) throw new Error(res.error ?? "激活失败");
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
    },
  });
}

export function useArchivePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<ApiResponse<TrainingPlan>>(
        `/api/training-plans/${id}/archive`,
        { method: "POST" }
      );
      if (!res.success) throw new Error(res.error ?? "归档失败");
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
    },
  });
}

export function useGeneratePlan() {
  return useMutation({
    mutationFn: async (constraints?: string) => {
      const res = await apiFetch<ApiResponse<WorkoutPlan & { constraints?: string }>>(
        "/api/training-plans/generate",
        {
          method: "POST",
          body: JSON.stringify({ constraints: constraints || null }),
        }
      );
      if (!res.success) throw new Error(res.error ?? "生成失败");
      return res.data!;
    },
  });
}

export function useRegeneratePlan() {
  return useMutation({
    mutationFn: async ({
      planId,
      constraints,
    }: {
      planId: string;
      constraints?: string;
    }) => {
      const res = await apiFetch<
        ApiResponse<WorkoutPlan & { constraints?: string; parent_plan_id?: string }>
      >("/api/training-plans/regenerate", {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          constraints: constraints || null,
        }),
      });
      if (!res.success) throw new Error(res.error ?? "重新生成失败");
      return res.data!;
    },
  });
}
