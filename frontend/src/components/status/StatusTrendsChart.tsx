"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyStatus } from "@/types";

interface StatusTrendsChartProps {
  data: DailyStatus[];
}

export function StatusTrendsChart({ data }: StatusTrendsChartProps) {
  if (data.length === 0) {
    return null;
  }

  const formatted = data.map((d) => ({
    date: d.date.slice(5),
    睡眠质量: d.sleep_quality,
    疲劳程度: d.fatigue_level,
    压力水平: d.stress_level,
    情绪: d.mood,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">状态趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} width={30} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="睡眠质量"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="疲劳程度"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="压力水平"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="情绪"
              stroke="var(--color-chart-4)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
