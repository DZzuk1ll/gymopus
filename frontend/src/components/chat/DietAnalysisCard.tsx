"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AIGeneratedBadge } from "@/components/legal/AIGeneratedBadge";
import type { DietAnalysis } from "@/types";

interface DietAnalysisCardProps {
  analysis: DietAnalysis;
}

const CONFIDENCE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  high: { label: "高置信度", variant: "default" },
  medium: { label: "中置信度", variant: "secondary" },
  low: { label: "低置信度", variant: "destructive" },
};

export function DietAnalysisCard({ analysis }: DietAnalysisCardProps) {
  const conf = CONFIDENCE_MAP[analysis.confidence] ?? CONFIDENCE_MAP.medium;

  const macroBar = (label: string, actual: number, target: number | undefined, unit: string) => {
    const t = target ?? 0;
    const pct = t > 0 ? Math.min(Math.round((actual / t) * 100), 150) : 0;
    const displayPct = Math.min(pct, 100);

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>{label}</span>
          <span className="font-mono font-semibold text-foreground">
            {actual.toFixed(0)}{unit}
            {t > 0 && ` / ${t.toFixed(0)}${unit} (${pct}%)`}
          </span>
        </div>
        {t > 0 && <Progress value={displayPct} className="h-2" />}
      </div>
    );
  };

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">饮食诊断</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={conf.variant}>{conf.label}</Badge>
            <AIGeneratedBadge />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {macroBar("热量", analysis.totals.calories, analysis.targets?.calories, "kcal")}
          {macroBar("蛋白质", analysis.totals.protein_g, analysis.targets?.protein_g, "g")}
          {macroBar("脂肪", analysis.totals.fat_g, analysis.targets?.fat_g, "g")}
          {macroBar("碳水", analysis.totals.carbs_g, analysis.targets?.carbs_g, "g")}
        </div>

        {analysis.parsed_foods.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">解析食物</p>
            {analysis.parsed_foods.map((food, i) => (
              <div key={i} className="text-xs flex justify-between py-0.5">
                <span>{food.name}</span>
                <span className="font-mono text-muted-foreground">
                  {food.calories.toFixed(0)}kcal
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm">{analysis.assessment}</p>

        {analysis.suggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">建议</p>
            <ul className="text-xs space-y-1">
              {analysis.suggestions.map((s, i) => (
                <li key={i} className="flex gap-1">
                  <span className="text-muted-foreground shrink-0">-</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
