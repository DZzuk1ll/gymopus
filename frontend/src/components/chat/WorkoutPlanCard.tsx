"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AIGeneratedBadge } from "@/components/legal/AIGeneratedBadge";
import { WorkoutLogger } from "@/components/workout/WorkoutLogger";
import { ChevronDown, ChevronRight, ClipboardList } from "lucide-react";
import type { WorkoutPlan } from "@/types";

interface WorkoutPlanCardProps {
  plan: WorkoutPlan;
}

export function WorkoutPlanCard({ plan }: WorkoutPlanCardProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [loggerDay, setLoggerDay] = useState<number | null>(null);

  const selectedDay = loggerDay !== null ? plan.days[loggerDay] : null;

  return (
    <>
      <Card className="mt-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{plan.plan_name}</CardTitle>
            <AIGeneratedBadge />
          </div>
          <p className="text-xs text-muted-foreground">{plan.description}</p>
          <Badge variant="outline" className="w-fit text-xs">
            每周 {plan.days_per_week} 天
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {plan.days.map((day, i) => (
            <div key={i} className="border rounded-md">
              <button
                className="w-full px-3 py-2 text-left text-sm font-medium flex justify-between items-center hover:bg-muted/50"
                onClick={() => setExpandedDay(expandedDay === i ? null : i)}
              >
                <span className="flex items-center gap-1">
                  {expandedDay === i ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  {day.day_name} — {day.focus}
                </span>
                <span className="text-xs text-muted-foreground">
                  {day.exercises.length} 个动作
                </span>
              </button>
              {expandedDay === i && (
                <div className="px-3 pb-3 space-y-1">
                  {day.exercises.map((ex, j) => {
                    const reps =
                      ex.reps_min === ex.reps_max
                        ? `${ex.reps_min}`
                        : `${ex.reps_min}-${ex.reps_max}`;
                    return (
                      <div
                        key={j}
                        className="text-xs flex justify-between items-start py-1 border-b last:border-0"
                      >
                        <div>
                          <span className="font-medium">{ex.name}</span>
                          {ex.notes && (
                            <p className="text-muted-foreground mt-0.5">
                              {ex.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap ml-2 font-mono">
                          {ex.sets}x{reps} R{ex.rest_seconds}s
                        </span>
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setLoggerDay(i)}
                  >
                    <ClipboardList className="size-3.5 mr-1" />
                    记录训练
                  </Button>
                </div>
              )}
            </div>
          ))}
          {plan.warnings.length > 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {plan.warnings.map((w, i) => (
                <p key={i}>! {w}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={loggerDay !== null}
        onOpenChange={(open) => !open && setLoggerDay(null)}
      >
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              记录训练 — {selectedDay?.day_name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {selectedDay && (
              <WorkoutLogger
                prefillExercises={selectedDay.exercises}
                onDone={() => setLoggerDay(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
