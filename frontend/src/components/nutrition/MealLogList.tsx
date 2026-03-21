"use client";

import { UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MealLog } from "@/types";

interface MealLogListProps {
  logs: MealLog[];
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "加餐",
};

export function MealLogList({ logs }: MealLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        <UtensilsCrossed className="size-8 mx-auto mb-2 text-muted-foreground/40" />
        今日暂无饮食记录
      </div>
    );
  }

  const grouped = logs.reduce(
    (acc, log) => {
      const type = log.meal_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(log);
      return acc;
    },
    {} as Record<string, MealLog[]>
  );

  const order = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="space-y-3">
      {order.map((type) => {
        const items = grouped[type];
        if (!items?.length) return null;

        return (
          <div key={type}>
            <h4 className="text-sm font-medium tracking-tight mb-1.5">
              {MEAL_TYPE_LABELS[type] ?? type}
            </h4>
            <div className="space-y-2">
              {items.map((log) => (
                <Card key={log.id}>
                  <CardContent className="py-3 px-4">
                    <p className="text-sm">{log.raw_description}</p>
                    {log.total_calories != null && (
                      <div className="flex gap-3 mt-1.5 text-xs font-mono text-muted-foreground">
                        <span>{log.total_calories.toFixed(0)} kcal</span>
                        {log.total_protein != null && (
                          <span>P {log.total_protein.toFixed(0)}g</span>
                        )}
                        {log.total_fat != null && (
                          <span>F {log.total_fat.toFixed(0)}g</span>
                        )}
                        {log.total_carbs != null && (
                          <span>C {log.total_carbs.toFixed(0)}g</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
