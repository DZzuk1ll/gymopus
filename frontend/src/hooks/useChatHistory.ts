"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, ChatMessage } from "@/types";

export function useChatHistory() {
  return useQuery({
    queryKey: ["chatHistory"],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<ChatMessage[]>>(
        "/api/chat/history"
      );
      return res.data ?? [];
    },
    staleTime: 0,
  });
}
