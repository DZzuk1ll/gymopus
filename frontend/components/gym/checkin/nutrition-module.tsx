"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect } from "react"

interface Meal {
  id: string
  name: string
  description: string
}

interface NutritionModuleProps {
  meals: Meal[]
  onMealsChange?: (meals: Meal[]) => void
}

export function NutritionModule({ meals: initialMeals, onMealsChange }: NutritionModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [meals, setMeals] = useState(initialMeals)

  useEffect(() => { setMeals(initialMeals) }, [initialMeals])
  useEffect(() => { onMealsChange?.(meals) }, [meals])

  const filledCount = meals.filter((m) => m.description.trim()).length

  const updateMeal = (id: string, description: string) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, description } : m))
    )
  }

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">饮食记录</h3>
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded",
            filledCount > 0 ? "bg-success/15 text-success" : "bg-surface-3 text-text-secondary"
          )}>
            {filledCount}/{meals.length} 餐
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border-default divide-y divide-border-default">
          {meals.map((meal) => (
            <div key={meal.id} className="px-4 py-3">
              <label className="text-xs font-medium text-text-muted mb-1.5 block">{meal.name}</label>
              <textarea
                value={meal.description}
                onChange={(e) => updateMeal(meal.id, e.target.value)}
                placeholder="描述你吃了什么，例如：两个鸡蛋、一碗燕麦粥、一杯牛奶"
                rows={2}
                className="w-full px-3 py-2 text-sm bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted resize-none"
              />
            </div>
          ))}

          <div className="px-4 py-2 bg-surface-2">
            <p className="text-[11px] text-text-muted">用自然语言描述即可，AI 会自动估算营养数据</p>
          </div>
        </div>
      )}
    </div>
  )
}
