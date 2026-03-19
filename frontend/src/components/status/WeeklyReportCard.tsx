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
            <h4 className="font-medium text-xs text-green-600 dark:text-green-400 mb-1">
              成就
            </h4>
            <ul className="space-y-0.5 text-xs">
              {report.achievements.map((a, i) => (
                <li key={i} className="flex gap-1">
                  <span className="text-green-600 dark:text-green-400 shrink-0">+</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.concerns.length > 0 && (
          <div>
            <h4 className="font-medium text-xs text-orange-600 dark:text-orange-400 mb-1">
              关注
            </h4>
            <ul className="space-y-0.5 text-xs">
              {report.concerns.map((c, i) => (
                <li key={i} className="flex gap-1">
                  <span className="text-orange-600 dark:text-orange-400 shrink-0">!</span>
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
