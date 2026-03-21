"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIGeneratedBadge } from "@/components/legal/AIGeneratedBadge";
import type { WeeklyReport } from "@/types";

interface WeeklyReportCardProps {
  report: WeeklyReport;
}

export function WeeklyReportCard({ report }: WeeklyReportCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">AI 周报</CardTitle>
          <AIGeneratedBadge />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {report.training_summary && (
          <div>
            <h4 className="font-medium text-xs text-muted-foreground mb-1">训练</h4>
            <p>{report.training_summary}</p>
          </div>
        )}
        {report.diet_summary && (
          <div>
            <h4 className="font-medium text-xs text-muted-foreground mb-1">饮食</h4>
            <p>{report.diet_summary}</p>
          </div>
        )}
        {report.status_summary && (
          <div>
            <h4 className="font-medium text-xs text-muted-foreground mb-1">状态</h4>
            <p>{report.status_summary}</p>
          </div>
        )}

        {report.achievements.length > 0 && (
          <div>
            <h4 className="font-medium text-xs text-[oklch(0.52_0.17_155)] dark:text-[oklch(0.68_0.15_155)] mb-1">
              成就
            </h4>
            <ul className="space-y-0.5 text-xs">
              {report.achievements.map((a, i) => (
                <li key={i} className="flex gap-1">
                  <span className="text-[oklch(0.52_0.17_155)] dark:text-[oklch(0.68_0.15_155)] shrink-0">+</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.concerns.length > 0 && (
          <div>
            <h4 className="font-medium text-xs text-[oklch(0.65_0.17_75)] dark:text-[oklch(0.75_0.14_75)] mb-1">
              关注
            </h4>
            <ul className="space-y-0.5 text-xs">
              {report.concerns.map((c, i) => (
                <li key={i} className="flex gap-1">
                  <span className="text-[oklch(0.65_0.17_75)] dark:text-[oklch(0.75_0.14_75)] shrink-0">!</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-xs text-muted-foreground mb-1">建议</h4>
            <ul className="space-y-0.5 text-xs">
              {report.recommendations.map((r, i) => (
                <li key={i} className="flex gap-1">
                  <span className="text-muted-foreground shrink-0">-</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
