"use client";

import { cn } from "@/lib/utils";
import { AIGeneratedBadge } from "@/components/legal/AIGeneratedBadge";
import { WorkoutPlanCard } from "@/components/chat/WorkoutPlanCard";
import { MealPlanCard } from "@/components/chat/MealPlanCard";
import { DietAnalysisCard } from "@/components/chat/DietAnalysisCard";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {!isUser && (
          <div className="mb-1">
            <AIGeneratedBadge />
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        {message.workout_plan && (
          <div className="mt-3">
            <WorkoutPlanCard plan={message.workout_plan} />
          </div>
        )}
        {message.meal_plan && (
          <div className="mt-3">
            <MealPlanCard plan={message.meal_plan} />
          </div>
        )}
        {message.diet_analysis && (
          <div className="mt-3">
            <DietAnalysisCard analysis={message.diet_analysis} />
          </div>
        )}
      </div>
    </div>
  );
}
