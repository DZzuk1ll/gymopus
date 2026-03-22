"use client";

import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUpdatePlan } from "@/hooks/useTrainingPlans";
import type { TrainingPlan, WorkoutDay, ExerciseInPlan } from "@/types";

interface PlanEditorProps {
  plan: TrainingPlan;
  onDone: () => void;
}

export function PlanEditor({ plan, onDone }: PlanEditorProps) {
  const updatePlan = useUpdatePlan();
  const [days, setDays] = useState<WorkoutDay[]>(plan.days);

  const updateExercise = (
    dayIdx: number,
    exIdx: number,
    field: keyof ExerciseInPlan,
    value: string | number
  ) => {
    setDays((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], exercises: [...next[dayIdx].exercises] };
      day.exercises[exIdx] = { ...day.exercises[exIdx], [field]: value };
      next[dayIdx] = day;
      return next;
    });
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDays((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], exercises: [...next[dayIdx].exercises] };
      day.exercises.splice(exIdx, 1);
      next[dayIdx] = day;
      return next;
    });
  };

  const addExercise = (dayIdx: number) => {
    setDays((prev) => {
      const next = [...prev];
      const day = { ...next[dayIdx], exercises: [...next[dayIdx].exercises] };
      day.exercises.push({
        exercise_id: "",
        name: "新动作",
        sets: 3,
        reps_min: 8,
        reps_max: 12,
        rest_seconds: 90,
        notes: "",
      });
      next[dayIdx] = day;
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await updatePlan.mutateAsync({ id: plan.id, days });
      toast.success("计划已更新");
      onDone();
    } catch (e) {
      toast.error(`保存失败：${e instanceof Error ? e.message : "未知错误"}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">编辑计划</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDone}>
            取消
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updatePlan.isPending}>
            <Save className="size-3 mr-1" />
            {updatePlan.isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {days.map((day, di) => (
        <Card key={di}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">
              {day.day_name} — {day.focus}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {day.exercises.map((ex, ei) => (
              <div key={ei} className="flex items-center gap-2">
                <Input
                  value={ex.name}
                  onChange={(e) =>
                    updateExercise(di, ei, "name", e.target.value)
                  }
                  className="flex-1 text-xs h-8"
                />
                <Input
                  type="number"
                  value={ex.sets}
                  onChange={(e) =>
                    updateExercise(di, ei, "sets", parseInt(e.target.value) || 0)
                  }
                  className="w-14 text-xs h-8 font-mono"
                  title="组数"
                />
                <span className="text-xs text-muted-foreground">x</span>
                <Input
                  type="number"
                  value={ex.reps_min}
                  onChange={(e) =>
                    updateExercise(
                      di,
                      ei,
                      "reps_min",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-14 text-xs h-8 font-mono"
                  title="最少次数"
                />
                <span className="text-xs text-muted-foreground">-</span>
                <Input
                  type="number"
                  value={ex.reps_max}
                  onChange={(e) =>
                    updateExercise(
                      di,
                      ei,
                      "reps_max",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-14 text-xs h-8 font-mono"
                  title="最多次数"
                />
                <Input
                  type="number"
                  value={ex.rest_seconds}
                  onChange={(e) =>
                    updateExercise(
                      di,
                      ei,
                      "rest_seconds",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-16 text-xs h-8 font-mono"
                  title="休息秒数"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeExercise(di, ei)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => addExercise(di)}
            >
              <Plus className="size-3 mr-1" />
              添加动作
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
