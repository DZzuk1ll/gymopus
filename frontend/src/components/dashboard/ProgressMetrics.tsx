"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useWorkoutLogs } from "@/hooks/useWorkouts";
import { useDailyStatuses } from "@/hooks/useStatus";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export function ProgressMetrics() {
  const start7 = daysAgo(7);
  const today = daysAgo(0);
  const { data: workouts } = useWorkoutLogs(start7, today);
  const { data: statuses } = useDailyStatuses(start7, today);

  // Count unique workout days
  const workoutDays = new Set(
    (workouts ?? []).map((w) => w.logged_date)
  ).size;

  // Count status check-in days
  const statusDays = statuses?.length ?? 0;

  // Streak: count consecutive days from today backwards that have status
  let streak = 0;
  if (statuses && statuses.length > 0) {
    const statusDates = new Set(statuses.map((s) => s.date));
    for (let i = 0; i < 30; i++) {
      if (statusDates.has(daysAgo(i))) {
        streak++;
      } else {
        break;
      }
    }
  }

  const metrics = [
    { label: "本周训练", value: `${workoutDays} 天`, sub: "过去 7 天" },
    { label: "连续打卡", value: `${streak} 天`, sub: "当前连续" },
    { label: "状态记录", value: `${statusDays}/7`, sub: "本周完成率" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="py-3 text-center">
            <p className="text-lg font-bold font-mono">{m.value}</p>
            <p className="text-xs font-medium">{m.label}</p>
            <p className="text-[10px] text-muted-foreground">{m.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
