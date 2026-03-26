"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  trend?: {
    value: number
    isPositive?: boolean
  }
  progress?: {
    current: number
    target: number
  }
  status?: "success" | "warning" | "danger" | "neutral"
  onClick?: () => void
}

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  progress,
  status = "neutral",
  onClick,
}: StatCardProps) {
  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    neutral: "text-text-secondary",
  }

  const progressColors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    neutral: "bg-accent",
  }

  const progressPercent = progress ? Math.min((progress.current / progress.target) * 100, 100) : 0

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 p-4 bg-surface-1 rounded-xl border border-border-default transition-all",
        onClick && "cursor-pointer hover:bg-surface-2 hover:border-border-hover"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("p-1.5 rounded-lg bg-surface-2 shrink-0", statusColors[status])}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-text-muted tracking-wide whitespace-nowrap">{label}</span>
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium shrink-0",
              trend.isPositive ? "text-success" : trend.value === 0 ? "text-text-muted" : "text-danger"
            )}
          >
            {trend.value > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend.value < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-text-primary font-mono">{value}</span>
        {unit && <span className="text-sm text-text-muted">{unit}</span>}
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="space-y-1">
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", progressColors[status])}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>目标 {progress.target}{unit}</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
