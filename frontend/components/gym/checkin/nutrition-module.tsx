"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface FoodItem {
  id: string
  name: string
  portion: string
  calories: number
  protein: number
}

interface Meal {
  id: string
  name: string
  items: FoodItem[]
}

interface NutritionModuleProps {
  meals: Meal[]
  targets: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export function NutritionModule({ meals: initialMeals, targets }: NutritionModuleProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [meals, setMeals] = useState(initialMeals)

  const totals = meals.reduce(
    (acc, meal) => {
      meal.items.forEach((item) => {
        acc.calories += item.calories
        acc.protein += item.protein
      })
      return acc
    },
    { calories: 0, protein: 0 }
  )

  const addFoodItem = (mealId: string) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id === mealId) {
          return {
            ...meal,
            items: [
              ...meal.items,
              {
                id: Date.now().toString(),
                name: "",
                portion: "",
                calories: 0,
                protein: 0,
              },
            ],
          }
        }
        return meal
      })
    )
  }

  const updateFoodItem = (mealId: string, itemId: string, field: keyof FoodItem, value: string | number) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id === mealId) {
          return {
            ...meal,
            items: meal.items.map((item) =>
              item.id === itemId ? { ...item, [field]: value } : item
            ),
          }
        }
        return meal
      })
    )
  }

  const removeFoodItem = (mealId: string, itemId: string) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.id === mealId) {
          return {
            ...meal,
            items: meal.items.filter((item) => item.id !== itemId),
          }
        }
        return meal
      })
    )
  }

  const caloriesDiff = totals.calories - targets.calories
  const proteinDiff = totals.protein - targets.protein

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">饮食记录</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-surface-3 text-text-secondary rounded">
            {totals.calories} / {targets.calories} kcal
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
        <div className="border-t border-border-default">
          {meals.map((meal) => (
            <div key={meal.id} className="border-b border-border-default last:border-b-0">
              {/* Meal Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-surface-2">
                <span className="text-sm font-medium text-text-primary">{meal.name}</span>
                <span className="text-xs text-text-muted">
                  {meal.items.reduce((acc, item) => acc + item.calories, 0)} kcal
                </span>
              </div>

              {/* Food Items */}
              <div className="divide-y divide-border-default">
                {meal.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateFoodItem(meal.id, item.id, "name", e.target.value)}
                      placeholder="食物名称"
                      className="flex-1 px-2 py-1 text-sm bg-surface-2 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                    />
                    <input
                      type="text"
                      value={item.portion}
                      onChange={(e) => updateFoodItem(meal.id, item.id, "portion", e.target.value)}
                      placeholder="份量"
                      className="w-20 px-2 py-1 text-sm bg-surface-2 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                    />
                    <input
                      type="number"
                      value={item.calories || ""}
                      onChange={(e) => updateFoodItem(meal.id, item.id, "calories", parseInt(e.target.value) || 0)}
                      placeholder="热量"
                      className="w-20 px-2 py-1 text-sm font-mono bg-surface-2 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                    />
                    <input
                      type="number"
                      value={item.protein || ""}
                      onChange={(e) => updateFoodItem(meal.id, item.id, "protein", parseInt(e.target.value) || 0)}
                      placeholder="蛋白质"
                      className="w-20 px-2 py-1 text-sm font-mono bg-surface-2 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                    />
                    <button
                      onClick={() => removeFoodItem(meal.id, item.id)}
                      className="p-1 hover:bg-danger/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-text-muted hover:text-danger" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addFoodItem(meal.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text-secondary hover:bg-surface-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加食物
                </button>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="px-4 py-3 bg-surface-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">与目标差距</span>
              <div className="flex gap-4">
                <span className={cn(
                  "font-mono",
                  caloriesDiff > 0 ? "text-warning" : caloriesDiff < -200 ? "text-danger" : "text-text-secondary"
                )}>
                  热量: {caloriesDiff > 0 ? "+" : ""}{caloriesDiff} kcal
                </span>
                <span className={cn(
                  "font-mono",
                  proteinDiff >= 0 ? "text-success" : "text-warning"
                )}>
                  蛋白质: {proteinDiff > 0 ? "+" : ""}{proteinDiff}g
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
