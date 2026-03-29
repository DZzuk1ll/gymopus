"use client"

import { cn } from "@/lib/utils"
import { Check, Clock, Moon, Dumbbell } from "lucide-react"

interface TrainingDay {
  day: string
  dayShort: string
  type: string
  muscles?: string[]
  volume?: string
  status: "completed" | "today" | "upcoming" | "rest"
}

interface TrainingPlanCardProps {
  weekDays: TrainingDay[]
  weekLabel?: string
}

const statusConfig = {
  completed: {
    icon: Check,
    bgClass: "bg-success/10",
    textClass: "text-success",
    borderClass: "border-transparent",
    labelClass: "bg-success/15 text-success",
    label: "已完成",
  },
  today: {
    icon: Dumbbell,
    bgClass: "bg-accent/10",
    textClass: "text-accent",
    borderClass: "border-l-2 border-l-accent",
    labelClass: "bg-accent/15 text-accent",
    label: "今日",
  },
  upcoming: {
    icon: Clock,
    bgClass: "bg-transparent",
    textClass: "text-text-muted",
    borderClass: "border-transparent",
    labelClass: "bg-surface-3 text-text-muted",
    label: "待完成",
  },
  rest: {
    icon: Moon,
    bgClass: "bg-transparent",
    textClass: "text-text-muted",
    borderClass: "border-transparent",
    labelClass: "bg-surface-3 text-text-muted",
    label: "休息",
  },
}

export function TrainingPlanCard({ weekDays, weekLabel }: TrainingPlanCardProps) {
  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <h3 className="text-sm font-medium text-text-primary">本周训练计划</h3>
        {weekLabel && <span className="text-xs text-text-muted">{weekLabel}</span>}
      </div>

      {/* Training Days */}
      <div className="divide-y divide-border-default">
        {weekDays.map((day) => {
          const config = statusConfig[day.status]
          const Icon = config.icon

          return (
            <div
              key={day.day}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors",
                config.bgClass,
                config.borderClass,
                day.status === "completed" && "opacity-70"
              )}
            >
              {/* Day */}
              <div className="w-8 shrink-0 text-center">
                <span className={cn("text-sm font-medium", config.textClass)}>
                  {day.dayShort}
                </span>
              </div>

              {/* Type & Muscles */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium whitespace-nowrap", day.status === "rest" ? "text-text-muted" : "text-text-primary")}>
                  {day.type}
                </p>
                {day.muscles && day.muscles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {day.muscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="px-1.5 py-0.5 text-[10px] font-medium bg-surface-3 text-text-secondary rounded whitespace-nowrap"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs font-medium shrink-0", config.labelClass)}>
                <Icon className="w-3 h-3" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
