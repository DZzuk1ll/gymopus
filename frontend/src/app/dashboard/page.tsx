"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { DailyStatusForm } from "@/components/status/DailyStatusForm";
import { WeightTrendChart } from "@/components/status/WeightTrendChart";
import { StatusTrendsChart } from "@/components/status/StatusTrendsChart";
import { StatusAveragesCard } from "@/components/status/StatusAveragesCard";
import { WeeklyReportCard } from "@/components/status/WeeklyReportCard";
import { WorkoutLogList } from "@/components/workout/WorkoutLogList";
import { useDailyStatuses, useStatusReport, useWeeklyAIReport } from "@/hooks/useStatus";
import { useWorkoutLogs } from "@/hooks/useWorkouts";
import { useUser } from "@/hooks/useUser";
import type { WeeklyReport } from "@/types";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && user && !user.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [user, userLoading, router]);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const daysBack = period === "weekly" ? 7 : 30;

  const startDate = daysAgo(daysBack);
  const endDate = daysAgo(0);

  const { data: statuses, isLoading: statusLoading } = useDailyStatuses(startDate, endDate);
  const { data: report, isLoading: reportLoading } = useStatusReport(period);
  const { data: workoutLogs, isLoading: workoutsLoading } = useWorkoutLogs(startDate, endDate);
  const weeklyReport = useWeeklyAIReport();
  const [aiReport, setAiReport] = useState<WeeklyReport | null>(null);

  const handleGenerateReport = async () => {
    try {
      const result = await weeklyReport.mutateAsync();
      if (result) setAiReport(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      if (msg.includes("429")) {
        toast.error("请求过于频繁，请稍后再试");
      } else {
        toast.error(`生成失败：${msg}`);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>

      <DailyStatusForm />

      <Tabs
        value={period}
        onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}
      >
        <TabsList className="w-full">
          <TabsTrigger value="weekly" className="flex-1">周</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1">月</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-4 mt-4">
          {reportLoading || statusLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[240px] w-full" />
              <Skeleton className="h-[240px] w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              {report && (
                <WeightTrendChart
                  data={report.weight_trend}
                  weightChange={report.weight_change}
                />
              )}
              <StatusTrendsChart data={statuses ?? []} />
              {report && (
                <StatusAveragesCard averages={report.averages} period={period} />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">AI 周报</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
            disabled={weeklyReport.isPending}
          >
            {weeklyReport.isPending ? "生成中..." : "生成周报"}
          </Button>
        </div>
        {aiReport && <WeeklyReportCard report={aiReport} />}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">训练记录</h2>
        {workoutsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <WorkoutLogList logs={workoutLogs ?? []} />
        )}
      </div>
    </div>
  );
}
