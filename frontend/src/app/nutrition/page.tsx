"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MealLogList } from "@/components/nutrition/MealLogList";
import { MacroSummaryChart } from "@/components/nutrition/MacroSummaryChart";
import { DietAnalysisCard } from "@/components/chat/DietAnalysisCard";
import { useMealLogs, useCreateMealLog, useAnalyzeDiet } from "@/hooks/useMeals";
import { useUser } from "@/hooks/useUser";
import type { DietAnalysis } from "@/types";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function NutritionPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && user && !user.onboarding_completed) {
      router.replace("/onboarding");
    }
  }, [user, userLoading, router]);
  const today = todayStr();
  const { data: logs, isLoading } = useMealLogs(today, today);
  const createLog = useCreateMealLog();
  const analyzeDiet = useAnalyzeDiet();

  const [mealType, setMealType] = useState("lunch");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [analysisResult, setAnalysisResult] = useState<DietAnalysis | null>(null);

  const canSubmit = description.trim().length > 0;

  const handleLogOnly = async () => {
    if (!canSubmit) return;
    try {
      await createLog.mutateAsync({
        logged_date: date,
        meal_type: mealType,
        raw_description: description.trim(),
      });
      toast.success("饮食已记录");
      setDescription("");
      setAnalysisResult(null);
    } catch (e) {
      toast.error(`记录失败：${e instanceof Error ? e.message : "未知错误"}`);
    }
  };

  const handleLogAndAnalyze = async () => {
    if (!canSubmit) return;
    try {
      const result = await analyzeDiet.mutateAsync({
        logged_date: date,
        meal_type: mealType,
        raw_description: description.trim(),
      });
      if (result) setAnalysisResult(result);
      toast.success("饮食已记录并分析");
      setDescription("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      if (msg.includes("429")) {
        toast.error("请求过于频繁，请稍后再试");
      } else {
        toast.error(`分析失败：${msg}`);
      }
    }
  };

  const isPending = createLog.isPending || analyzeDiet.isPending;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">饮食记录</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">快速记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">餐次</Label>
              <Select value={mealType} onValueChange={(v) => v && setMealType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">早餐</SelectItem>
                  <SelectItem value="lunch">午餐</SelectItem>
                  <SelectItem value="dinner">晚餐</SelectItem>
                  <SelectItem value="snack">加餐</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">日期</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">吃了什么</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例：一碗米饭，200g 鸡胸肉，清炒西兰花"
              disabled={isPending}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={!canSubmit || isPending}
              onClick={handleLogOnly}
            >
              {createLog.isPending ? "记录中..." : "仅记录"}
            </Button>
            <Button
              className="flex-1"
              disabled={!canSubmit || isPending}
              onClick={handleLogAndAnalyze}
            >
              {analyzeDiet.isPending ? "分析中..." : "记录并分析"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisResult && <DietAnalysisCard analysis={analysisResult} />}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <MealLogList logs={logs ?? []} />
          <MacroSummaryChart logs={logs ?? []} />
        </>
      )}
    </div>
  );
}
