"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useExerciseHistory } from "@/hooks/useWorkouts";

interface ExerciseHistorySheetProps {
  exerciseId: string | null;
  onClose: () => void;
}

export function ExerciseHistorySheet({
  exerciseId,
  onClose,
}: ExerciseHistorySheetProps) {
  const { data, isLoading } = useExerciseHistory(exerciseId);
  const history = data?.history ?? [];
  const progression = data?.progression;

  const chartData = history.map((h) => ({
    date: h.logged_date.slice(5),
    weight: h.weight_kg,
  }));

  return (
    <Sheet open={!!exerciseId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>
            {history.length > 0 ? history[0].exercise_name : "动作历史"}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-4 mt-4 overflow-y-auto">
            {chartData.length > 1 && (
              <div>
                <h4 className="text-sm font-medium mb-2">重量趋势</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="重量(kg)"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {progression && Object.keys(progression).length > 0 && (
              <div className="border rounded-md p-3 text-sm space-y-1">
                <h4 className="font-medium text-xs text-muted-foreground">
                  渐进超负荷建议
                </h4>
                {Object.entries(progression).map(([key, value]) => (
                  <p key={key}>
                    <span className="text-muted-foreground">{key}:</span>{" "}
                    {String(value)}
                  </p>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">历史记录</h4>
              <div className="space-y-1">
                {history.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between text-xs py-1.5 border-b last:border-0"
                  >
                    <span className="text-muted-foreground">{log.logged_date}</span>
                    <span className="font-mono">
                      {log.sets_completed}x{log.reps_completed}
                      {log.weight_kg != null && ` @${log.weight_kg}kg`}
                      {log.rpe != null && ` RPE${log.rpe}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
