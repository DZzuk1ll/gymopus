"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useCreateWorkoutLogs } from "@/hooks/useWorkouts";
import type { WorkoutLogCreate, ExerciseInPlan } from "@/types";

interface WorkoutLoggerProps {
  prefillExercises?: ExerciseInPlan[];
  date?: string;
  onDone?: () => void;
}

interface LogEntry {
  exercise_name: string;
  exercise_id?: string;
  sets_completed: string;
  reps_completed: string;
  weight_kg: string;
  rpe: string;
  notes: string;
}

function emptyEntry(): LogEntry {
  return {
    exercise_name: "",
    sets_completed: "",
    reps_completed: "",
    weight_kg: "",
    rpe: "",
    notes: "",
  };
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function WorkoutLogger({ prefillExercises, date, onDone }: WorkoutLoggerProps) {
  const createLogs = useCreateWorkoutLogs();
  const [logDate, setLogDate] = useState(date ?? todayStr());

  const initialEntries: LogEntry[] = prefillExercises?.length
    ? prefillExercises.map((ex) => ({
        exercise_name: ex.name,
        exercise_id: ex.exercise_id,
        sets_completed: String(ex.sets),
        reps_completed: String(ex.reps_min),
        weight_kg: "",
        rpe: "",
        notes: ex.notes || "",
      }))
    : [emptyEntry()];

  const [entries, setEntries] = useState<LogEntry[]>(initialEntries);

  const updateEntry = (index: number, field: keyof LogEntry, value: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, emptyEntry()]);
  };

  const handleSubmit = async () => {
    const valid = entries.filter(
      (e) => e.exercise_name.trim() && e.sets_completed && e.reps_completed
    );
    if (valid.length === 0) {
      toast.error("请至少填写一个动作");
      return;
    }

    const payload: WorkoutLogCreate[] = valid.map((e) => ({
      logged_date: logDate,
      exercise_id: e.exercise_id || null,
      exercise_name: e.exercise_name.trim(),
      sets_completed: parseInt(e.sets_completed),
      reps_completed: parseInt(e.reps_completed),
      weight_kg: e.weight_kg ? parseFloat(e.weight_kg) : null,
      rpe: e.rpe ? parseFloat(e.rpe) : null,
      notes: e.notes || null,
    }));

    try {
      await createLogs.mutateAsync(payload);
      toast.success(`已记录 ${payload.length} 个动作`);
      onDone?.();
    } catch (e) {
      toast.error(`记录失败：${e instanceof Error ? e.message : "未知错误"}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">训练日期</Label>
        <Input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
        />
      </div>

      {entries.map((entry, i) => (
        <div key={i} className="border border-border/70 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              动作 {i + 1}
            </span>
            {entries.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEntry(i)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
          <Input
            value={entry.exercise_name}
            onChange={(e) => updateEntry(i, "exercise_name", e.target.value)}
            placeholder="动作名称"
          />
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">组数</Label>
              <Input
                type="number"
                value={entry.sets_completed}
                onChange={(e) => updateEntry(i, "sets_completed", e.target.value)}
                placeholder="4"
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">次数</Label>
              <Input
                type="number"
                value={entry.reps_completed}
                onChange={(e) => updateEntry(i, "reps_completed", e.target.value)}
                placeholder="10"
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">重量(kg)</Label>
              <Input
                type="number"
                step="2.5"
                value={entry.weight_kg}
                onChange={(e) => updateEntry(i, "weight_kg", e.target.value)}
                placeholder="60"
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">RPE</Label>
              <Input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={entry.rpe}
                onChange={(e) => updateEntry(i, "rpe", e.target.value)}
                placeholder="8"
                className="font-mono"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={addEntry}
      >
        <Plus className="size-4 mr-1" />
        添加动作
      </Button>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={createLogs.isPending}
      >
        {createLogs.isPending ? "提交中..." : "提交训练记录"}
      </Button>
    </div>
  );
}
