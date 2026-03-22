"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrainingPlan } from "@/types";

interface ActivePlanDisplayProps {
  plan: TrainingPlan;
  onEdit: () => void;
  onRegenerate: () => void;
}

export function ActivePlanDisplay({
  plan,
  onEdit,
  onRegenerate,
}: ActivePlanDisplayProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{plan.plan_name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan.description}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {plan.days_per_week} 天/周
          </Badge>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-3 mr-1" />
            编辑
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="size-3 mr-1" />
            重新生成
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {plan.days.map((day, i) => (
          <div key={i} className="border border-border/50 rounded-lg">
            <button
              onClick={() => setExpandedDay(expandedDay === i ? null : i)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{day.day_name}</span>
                <span className="text-xs text-muted-foreground">
                  {day.focus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {day.exercises.length} 个动作
                </span>
                {expandedDay === i ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </div>
            </button>
            {expandedDay === i && (
              <div className="px-3 pb-3 space-y-1.5">
                {day.exercises.map((ex, j) => {
                  const reps =
                    ex.reps_min === ex.reps_max
                      ? `${ex.reps_min}`
                      : `${ex.reps_min}-${ex.reps_max}`;
                  return (
                    <div
                      key={j}
                      className="flex justify-between items-center text-xs"
                    >
                      <span>{ex.name}</span>
                      <span className="font-mono text-muted-foreground">
                        {ex.sets}x{reps} / {ex.rest_seconds}s
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {plan.warnings.length > 0 && (
          <div className="mt-2">
            {plan.warnings.map((w, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {w}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
