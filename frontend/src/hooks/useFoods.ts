"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, Food } from "@/types";

export function useSearchFoods(name: string) {
  return useQuery({
    queryKey: ["foods", name],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<Food[]>>(
        `/api/knowledge/foods?name=${encodeURIComponent(name)}`
      );
      return res.data ?? [];
    },
    enabled: name.length >= 1,
  });
}
