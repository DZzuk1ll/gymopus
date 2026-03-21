"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusAverages } from "@/types";

interface StatusAveragesCardProps {
  averages: StatusAverages;
  period: string;
}

export function StatusAveragesCard({ averages, period }: StatusAveragesCardProps) {
  const items = [
    { label: "体重", value: averages.weight_kg, unit: "kg", decimals: 1 },
    { label: "睡眠时长", value: averages.sleep_hours, unit: "h", decimals: 1 },
    { label: "睡眠质量", value: averages.sleep_quality, unit: "/5", decimals: 1 },
    { label: "疲劳程度", value: averages.fatigue_level, unit: "/5", decimals: 1 },
    { label: "压力水平", value: averages.stress_level, unit: "/5", decimals: 1 },
    { label: "情绪", value: averages.mood, unit: "/5", decimals: 1 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          {period === "weekly" ? "周" : "月"}均值
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="font-mono text-base font-semibold text-foreground">
                {item.value != null ? (
                  <>
                    {item.value.toFixed(item.decimals)}
                    <span className="text-xs text-muted-foreground ml-0.5">{item.unit}</span>
                  </>
                ) : "-"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
