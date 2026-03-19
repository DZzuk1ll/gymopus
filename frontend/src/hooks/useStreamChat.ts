"use client";

import { useState, useCallback, useRef } from "react";
import { apiStreamChat } from "@/lib/api";
import type {
  ChatMessage,
  WorkoutPlan,
  MealPlan,
  DietAnalysis,
} from "@/types";

export function useStreamChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);
  const initializedRef = useRef(false);

  const initializeMessages = useCallback((history: ChatMessage[]) => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setMessages(history);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    abortRef.current = false;
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      await apiStreamChat(
        message,
        (token) => {
          if (abortRef.current) return;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + token,
              };
            }
            return updated;
          });
        },
        (data) => {
          if (abortRef.current) return;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: data.response,
                intent: data.intent,
                workout_plan: data.workout_plan as WorkoutPlan | null,
                meal_plan: data.meal_plan as MealPlan | null,
                diet_analysis: data.diet_analysis as DietAnalysis | null,
              };
            }
            return updated;
          });
        },
        (errorMsg) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: `出错了：${errorMsg}`,
              };
            }
            return updated;
          });
        }
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "连接失败";
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: `出错了：${msg}`,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, sendMessage, initializeMessages };
}
