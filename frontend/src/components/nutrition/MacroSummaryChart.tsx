"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MealLog } from "@/types";

interface MacroSummaryChartProps {
  logs: MealLog[];
  targetCalories?: number;
  targetProtein?: number;
  targetFat?: number;
  targetCarbs?: number;
}

export function MacroSummaryChart({
  logs,
  targetCalories = 0,
  targetProtein = 0,
  targetFat = 0,
  targetCarbs = 0,
}: MacroSummaryChartProps) {
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.total_calories ?? 0),
      protein: acc.protein + (log.total_protein ?? 0),
      fat: acc.fat + (log.total_fat ?? 0),
      carbs: acc.carbs + (log.total_carbs ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const data = [
    {
      name: "热量(kcal)",
      实际: Math.round(totals.calories),
      目标: targetCalories,
    },
    {
      name: "蛋白质(g)",
      实际: Math.round(totals.protein),
      目标: targetProtein,
    },
    {
      name: "脂肪(g)",
      实际: Math.round(totals.fat),
      目标: targetFat,
    },
    {
      name: "碳水(g)",
      实际: Math.round(totals.carbs),
      目标: targetCarbs,
    },
  ];

  const hasTarget = targetCalories > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">今日营养素汇总</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            记录饮食后查看汇总
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="实际"
                fill="var(--color-chart-1)"
                radius={[4, 4, 0, 0]}
              />
              {hasTarget && (
                <Bar
                  dataKey="目标"
                  fill="var(--color-chart-3)"
                  radius={[4, 4, 0, 0]}
                  opacity={0.5}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
