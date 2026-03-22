"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { ApiResponse } from "@/types";

interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  meal_count: number;
  targets: {
    target_calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  } | null;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function NutritionTargetGap() {
  const today = todayStr();
  const { data, isLoading } = useQuery({
    queryKey: ["dailySummary", today],
    queryFn: async () => {
      const res = await apiFetch<ApiResponse<DailySummary>>(
        `/api/meals/daily-summary?date=${today}`
      );
      return res.data;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[120px] w-full" />;
  }

  if (!data || !data.targets) {
    return null;
  }

  const { targets } = data;
  const macros = [
    {
      label: "热量",
      current: data.total_calories,
      target: targets.target_calories,
      unit: "kcal",
    },
    {
      label: "蛋白质",
      current: data.total_protein,
      target: targets.protein_g,
      unit: "g",
    },
    {
      label: "脂肪",
      current: data.total_fat,
      target: targets.fat_g,
      unit: "g",
    },
    {
      label: "碳水",
      current: data.total_carbs,
      target: targets.carbs_g,
      unit: "g",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">今日摄入 vs 目标</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {macros.map((m) => {
          const pct = m.target > 0 ? Math.min((m.current / m.target) * 100, 100) : 0;
          const gap = m.target - m.current;
          return (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{m.label}</span>
                <span className="font-mono text-muted-foreground">
                  {Math.round(m.current)} / {Math.round(m.target)} {m.unit}
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
              {gap > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  还差 {Math.round(gap)} {m.unit}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
