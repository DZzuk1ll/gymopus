"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, User } from "@/types";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<User>>("/api/users/me");
      return res.data;
    },
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiFetch<ApiResponse<User>>("/api/users/me/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: async () => {
      await apiFetch<ApiResponse<null>>("/api/users/me", {
        method: "DELETE",
      });
    },
  });
}
