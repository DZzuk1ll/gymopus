"use client";

import { useState } from "react";
import { Sparkles, Check, X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useGeneratePlan, useSavePlan, useActivatePlan } from "@/hooks/useTrainingPlans";
import type { WorkoutPlan } from "@/types";

export function PlanGenerationFlow() {
  const generatePlan = useGeneratePlan();
  const savePlan = useSavePlan();
  const activatePlan = useActivatePlan();

  const [constraints, setConstraints] = useState("");
  const [preview, setPreview] = useState<(WorkoutPlan & { constraints?: string }) | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const handleGenerate = async () => {
    try {
      const result = await generatePlan.mutateAsync(constraints || undefined);
      setPreview(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      if (msg.includes("429")) {
        toast.error("请求过于频繁，请稍后再试");
      } else {
        toast.error(`生成失败：${msg}`);
      }
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    try {
      const saved = await savePlan.mutateAsync({
        plan_name: preview.plan_name,
        description: preview.description,
        days_per_week: preview.days_per_week,
        days: preview.days,
        methodology_notes: preview.methodology_notes,
        warnings: preview.warnings,
        constraints: preview.constraints || null,
        source: "training_page",
      });
      await activatePlan.mutateAsync(saved.id);
      toast.success("计划已导入并激活");
      setPreview(null);
      setConstraints("");
    } catch (e) {
      toast.error(`导入失败：${e instanceof Error ? e.message : "未知错误"}`);
    }
  };

  const handleDiscard = () => {
    setPreview(null);
  };

  if (preview) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{preview.plan_name}</CardTitle>
          <p className="text-xs text-muted-foreground">{preview.description}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {preview.days.map((day, i) => (
            <div key={i} className="border border-border/50 rounded-lg">
              <button
                onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{day.day_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {day.focus}
                  </span>
                </div>
                {expandedDay === i ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
              {expandedDay === i && (
                <div className="px-3 pb-3 space-y-1.5">
                  {day.exercises.map((ex, j) => {
                    const reps =
                      ex.reps_min === ex.reps_max
                        ? `${ex.reps_min}`
                        : `${ex.reps_min}-${ex.reps_max}`;
                    return (
                      <div
                        key={j}
                        className="flex justify-between items-center text-xs"
                      >
                        <span>{ex.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {ex.sets}x{reps} / {ex.rest_seconds}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={handleImport}
              disabled={savePlan.isPending || activatePlan.isPending}
            >
              <Check className="size-3 mr-1" />
              {savePlan.isPending ? "保存中..." : "导入并激活"}
            </Button>
            <Button variant="outline" size="icon" onClick={handleGenerate} disabled={generatePlan.isPending}>
              <RefreshCw className={`size-4 ${generatePlan.isPending ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDiscard}>
              <X className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">生成训练计划</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="输入额外要求（可选）：如'只用哑铃'、'每次45分钟'、'侧重背部'"
          rows={2}
        />
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={generatePlan.isPending}
        >
          <Sparkles className="size-3.5 mr-1.5" />
          {generatePlan.isPending ? "AI 生成中..." : "生成计划"}
        </Button>
      </CardContent>
    </Card>
  );
}
