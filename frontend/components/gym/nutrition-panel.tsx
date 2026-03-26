"use client"

import { cn } from "@/lib/utils"
import { Flame, Beef, Wheat, Droplets } from "lucide-react"

interface MacroData {
  current: number
  target: number
}

interface NutritionPanelProps {
  calories: MacroData
  protein: MacroData
  carbs: MacroData
  fat: MacroData
  phase: string
}

export function NutritionPanel({ calories, protein, carbs, fat, phase }: NutritionPanelProps) {
  const caloriePercent = Math.min((calories.current / calories.target) * 100, 100)

  const macros = [
    {
      label: "蛋白质",
      icon: Beef,
      current: protein.current,
      target: protein.target,
      unit: "g",
      color: "bg-accent",
    },
    {
      label: "碳水",
      icon: Wheat,
      current: carbs.current,
      target: carbs.target,
      unit: "g",
      color: "bg-warning",
    },
    {
      label: "脂肪",
      icon: Droplets,
      current: fat.current,
      target: fat.target,
      unit: "g",
      color: "bg-info",
    },
  ]

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <h3 className="text-sm font-medium text-text-primary">今日营养</h3>
        <span className={cn(
          "px-2 py-0.5 text-xs font-medium rounded",
          phase === "增肌" ? "bg-success/15 text-success" : phase === "减脂" ? "bg-danger/15 text-danger" : "bg-surface-3 text-text-muted"
        )}>
          {phase}期
        </span>
      </div>

      {/* Calories */}
      <div className="px-4 py-4 border-b border-border-default">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-surface-2">
              <Flame className="w-4 h-4 text-warning" />
            </div>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wide">热量</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-text-primary font-mono">{calories.current}</span>
            <span className="text-sm text-text-muted">/ {calories.target} kcal</span>
          </div>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              caloriePercent >= 90 && caloriePercent <= 110 ? "bg-success" : caloriePercent > 110 ? "bg-danger" : "bg-warning"
            )}
            style={{ width: `${caloriePercent}%` }}
          />
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 divide-x divide-border-default">
        {macros.map((macro) => {
          const percent = Math.min((macro.current / macro.target) * 100, 100)
          const Icon = macro.icon

          return (
            <div key={macro.label} className="px-3 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">{macro.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-lg font-semibold text-text-primary font-mono">{macro.current}</span>
                <span className="text-xs text-text-muted">/ {macro.target}{macro.unit}</span>
              </div>
              <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", macro.color)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
