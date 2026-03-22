"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAnalyzeInsights } from "@/hooks/useInsights";
import type { AnalysisResult } from "@/types";

export function AIInsightsCard() {
  const analyze = useAnalyzeInsights();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    try {
      const data = await analyze.mutateAsync();
      setResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      if (msg.includes("429")) {
        toast.error("请求过于频繁，请稍后再试");
      } else {
        toast.error(`分析失败：${msg}`);
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            AI 洞察
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={analyze.isPending}
          >
            {analyze.isPending ? "分析中..." : "分析近期数据"}
          </Button>
        </div>
      </CardHeader>
      {result && (
        <CardContent className="space-y-3 text-sm">
          <p>{result.summary}</p>

          {result.insights.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                洞察
              </p>
              <ul className="space-y-0.5">
                {result.insights.map((item, i) => (
                  <li key={i} className="text-xs text-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.concerns.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                需要关注
              </p>
              <ul className="space-y-0.5">
                {result.concerns.map((item, i) => (
                  <li key={i} className="text-xs text-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                建议
              </p>
              <ul className="space-y-0.5">
                {result.recommendations.map((item, i) => (
                  <li key={i} className="text-xs text-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
