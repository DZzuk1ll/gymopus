"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ExerciseHistorySheet } from "@/components/workout/ExerciseHistorySheet";
import type { WorkoutLog } from "@/types";

interface WorkoutLogListProps {
  logs: WorkoutLog[];
}

export function WorkoutLogList({ logs }: WorkoutLogListProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        <Dumbbell className="size-8 mx-auto mb-2 text-muted-foreground/40" />
        暂无训练记录
      </div>
    );
  }

  const grouped = logs.reduce(
    (acc, log) => {
      const date = log.logged_date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    },
    {} as Record<string, WorkoutLog[]>
  );

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <>
      <div className="space-y-4">
        {sortedDates.map((date) => (
          <div key={date}>
            <h4 className="text-sm font-medium font-mono mb-2 text-muted-foreground">
              {date}
            </h4>
            <Card>
              <CardContent className="py-2 px-0">
                {grouped[date].map((log) => (
                  <button
                    key={log.id}
                    className="w-full text-left px-4 py-2 hover:bg-muted/50 flex justify-between items-center text-sm border-b last:border-0"
                    onClick={() =>
                      log.exercise_id && setSelectedExerciseId(log.exercise_id)
                    }
                  >
                    <span className="font-medium">{log.exercise_name}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {log.sets_completed}x{log.reps_completed}
                      {log.weight_kg != null && ` @${log.weight_kg}kg`}
                      {log.rpe != null && ` RPE${log.rpe}`}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <ExerciseHistorySheet
        exerciseId={selectedExerciseId}
        onClose={() => setSelectedExerciseId(null)}
      />
    </>
  );
}
