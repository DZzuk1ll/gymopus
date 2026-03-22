"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutLogList } from "@/components/workout/WorkoutLogList";
import { useWorkoutLogs } from "@/hooks/useWorkouts";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export function TrainingLogHistory() {
  const { data: logs, isLoading } = useWorkoutLogs(daysAgo(7), daysAgo(0));

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return <WorkoutLogList logs={logs ?? []} />;
}
