"use client";

import { Dumbbell, UtensilsCrossed, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkoutLogs } from "@/hooks/useWorkouts";
import { useMealLogs } from "@/hooks/useMeals";
import { useDailyStatuses } from "@/hooks/useStatus";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function TodayOverview() {
  const today = todayStr();
  const { data: workouts } = useWorkoutLogs(today, today);
  const { data: meals } = useMealLogs(today, today);
  const { data: statuses } = useDailyStatuses(today, today);

  const hasWorkout = (workouts?.length ?? 0) > 0;
  const mealCount = meals?.length ?? 0;
  const hasStatus = (statuses?.length ?? 0) > 0;

  const items = [
    {
      label: "训练",
      icon: Dumbbell,
      done: hasWorkout,
      detail: hasWorkout ? `${workouts!.length} 组` : "未记录",
    },
    {
      label: "饮食",
      icon: UtensilsCrossed,
      done: mealCount > 0,
      detail: mealCount > 0 ? `${mealCount} 餐` : "未记录",
    },
    {
      label: "状态",
      icon: Activity,
      done: hasStatus,
      detail: hasStatus ? "已打卡" : "未打卡",
    },
  ];

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground mb-3">今日记录</p>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className={`size-8 rounded-lg flex items-center justify-center ${
                  item.done
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <item.icon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-medium">{item.label}</p>
                <p
                  className={`text-xs ${
                    item.done ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
