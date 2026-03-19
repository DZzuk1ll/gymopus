"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIGeneratedBadge } from "@/components/legal/AIGeneratedBadge";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MealPlan } from "@/types";

interface MealPlanCardProps {
  plan: MealPlan;
}

export function MealPlanCard({ plan }: MealPlanCardProps) {
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  const pct = (actual: number, target: number) =>
    target > 0 ? Math.round((actual / target) * 100) : 0;

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{plan.plan_name}</CardTitle>
          <AIGeneratedBadge />
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="font-mono text-xs">
            目标 {plan.target.calories.toFixed(0)} kcal
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            实际 {plan.total.calories.toFixed(0)} kcal (
            {pct(plan.total.calories, plan.target.calories)}%)
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">蛋白质</div>
            <div className="font-mono font-medium">
              {plan.total.protein_g.toFixed(0)}g / {plan.target.protein_g.toFixed(0)}g
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">脂肪</div>
            <div className="font-mono font-medium">
              {plan.total.fat_g.toFixed(0)}g / {plan.target.fat_g.toFixed(0)}g
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">碳水</div>
            <div className="font-mono font-medium">
              {plan.total.carbs_g.toFixed(0)}g / {plan.target.carbs_g.toFixed(0)}g
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {plan.meals.map((meal, i) => (
          <div key={i} className="border rounded-md">
            <button
              className="w-full px-3 py-2 text-left text-sm font-medium flex justify-between items-center hover:bg-muted/50"
              onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}
            >
              <span className="flex items-center gap-1">
                {expandedMeal === i ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
                {meal.meal_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {meal.foods.length} 种食物
              </span>
            </button>
            {expandedMeal === i && (
              <div className="px-3 pb-3 space-y-1">
                {meal.foods.map((food, j) => (
                  <div
                    key={j}
                    className="text-xs flex justify-between items-start py-1 border-b last:border-0"
                  >
                    <div>
                      <span className="font-medium">{food.name}</span>
                      <span className="text-muted-foreground ml-1 font-mono">
                        {food.portion_g}g
                      </span>
                    </div>
                    <span className="text-muted-foreground whitespace-nowrap ml-2 font-mono">
                      {food.calories.toFixed(0)}kcal P{food.protein.toFixed(0)}
                      F{food.fat.toFixed(0)} C{food.carbs.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {plan.notes && (
          <p className="text-xs text-muted-foreground mt-2">{plan.notes}</p>
        )}
        {plan.warnings.length > 0 && (
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
            {plan.warnings.map((w, i) => (
              <p key={i}>! {w}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
