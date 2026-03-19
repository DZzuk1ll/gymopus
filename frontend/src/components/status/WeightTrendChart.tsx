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
import type { WeightTrend } from "@/types";

interface WeightTrendChartProps {
  data: WeightTrend[];
  weightChange: number | null;
}

export function WeightTrendChart({ data, weightChange }: WeightTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">体重趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            记录每日状态后查看趋势
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">体重趋势</CardTitle>
          {weightChange != null && (
            <span
              className={`text-xs font-mono ${
                weightChange > 0
                  ? "text-red-500"
                  : weightChange < 0
                    ? "text-green-500"
                    : "text-muted-foreground"
              }`}
            >
              {weightChange > 0 ? "+" : ""}
              {weightChange.toFixed(1)} kg
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontSize: 11 }}
              width={40}
            />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="value"
              name="体重"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="moving_avg"
              name="移动平均"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
