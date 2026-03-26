"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar } from "@/components/gym/top-bar"
import { TrendChart } from "@/components/gym/trends/trend-chart"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Dumbbell, Scale, Flame, Moon, Heart, ChevronRight } from "lucide-react"

// Mock data generators
const generateTrendData = (days: number, baseValue: number, variance: number) => {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
      value: baseValue + (Math.random() - 0.5) * variance * 2,
    })
  }
  return data
}

const timeRanges = [
  { label: "7 天", days: 7 },
  { label: "30 天", days: 30 },
  { label: "90 天", days: 90 },
]

const dimensions = [
  { id: "all", label: "全部", icon: null },
  { id: "training", label: "训练", icon: Dumbbell },
  { id: "body", label: "身体指标", icon: Scale },
  { id: "nutrition", label: "营养", icon: Flame },
  { id: "sleep", label: "睡眠", icon: Moon },
  { id: "mood", label: "情绪", icon: Heart },
]

export default function TrendsPage() {
  const [selectedRange, setSelectedRange] = useState(30)
  const [selectedDimension, setSelectedDimension] = useState("all")

  // Generate data based on selected range
  const trainingVolumeData = generateTrendData(selectedRange, 55000, 5000)
  const weightData = generateTrendData(selectedRange, 78, 1.5)
  const caloriesData = generateTrendData(selectedRange, 2600, 300)
  const proteinData = generateTrendData(selectedRange, 165, 20)
  const sleepData = generateTrendData(selectedRange, 7.2, 1.5)
  const moodData = generateTrendData(selectedRange, 3.8, 1)

  const showChart = (dimension: string) => {
    return selectedDimension === "all" || selectedDimension === dimension
  }

  // Mesocycle annotations
  const annotations = [
    { date: "3月1日", label: "Mesocycle 2 开始" },
    { date: "3月15日", label: "Deload 周" },
  ]

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 lg:ml-[240px] min-w-0">
        <TopBar title="历史趋势" showDate={false} />

        <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6 max-w-full">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-surface-1 rounded-xl border border-border-default">
            {/* Time Range */}
            <div>
              <p className="text-xs text-text-muted mb-2">时间范围</p>
              <div className="flex gap-2">
                {timeRanges.map((range) => (
                  <button
                    key={range.days}
                    onClick={() => setSelectedRange(range.days)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                      selectedRange === range.days
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimension Filter */}
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-2">数据维度</p>
              <div className="flex flex-wrap gap-2">
                {dimensions.map((dim) => {
                  const Icon = dim.icon
                  return (
                    <button
                      key={dim.id}
                      onClick={() => setSelectedDimension(dim.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                        selectedDimension === dim.id
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                      )}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      {dim.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-4">
            {/* Training */}
            {showChart("training") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-medium text-text-primary">训练趋势</h2>
                </div>
                <TrendChart
                  title="周训练容量"
                  data={trainingVolumeData}
                  unit="kg"
                  targetValue={60000}
                  color="accent"
                  annotations={annotations}
                />
              </div>
            )}

            {/* Body */}
            {showChart("body") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-success" />
                  <h2 className="text-sm font-medium text-text-primary">身体指标趋势</h2>
                </div>
                <TrendChart
                  title="体重"
                  data={weightData}
                  unit="kg"
                  targetValue={80}
                  color="success"
                />
              </div>
            )}

            {/* Nutrition */}
            {showChart("nutrition") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-warning" />
                  <h2 className="text-sm font-medium text-text-primary">营养趋势</h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-4">
                  <TrendChart
                    title="日均热量摄入"
                    data={caloriesData}
                    unit="kcal"
                    targetValue={2800}
                    color="warning"
                  />
                  <TrendChart
                    title="日均蛋白质摄入"
                    data={proteinData}
                    unit="g"
                    targetValue={160}
                    color="accent"
                  />
                </div>
              </div>
            )}

            {/* Sleep */}
            {showChart("sleep") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-info" />
                  <h2 className="text-sm font-medium text-text-primary">睡眠趋势</h2>
                </div>
                <TrendChart
                  title="日均睡眠时长"
                  data={sleepData}
                  unit="小时"
                  targetValue={8}
                  color="accent"
                />
              </div>
            )}

            {/* Mood */}
            {showChart("mood") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-danger" />
                  <h2 className="text-sm font-medium text-text-primary">情绪趋势</h2>
                </div>
                <div className="bg-surface-1 rounded-xl border border-border-default p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-text-primary">情绪评分</h3>
                    <span className="text-xs text-text-muted">1-5 分制</span>
                  </div>
                  {/* Mood Calendar View */}
                  <div className="grid grid-cols-7 gap-1">
                    {moodData.slice(-28).map((day, i) => {
                      const score = Math.round(day.value)
                      const colors = {
                        1: "bg-danger",
                        2: "bg-warning",
                        3: "bg-text-muted",
                        4: "bg-success",
                        5: "bg-accent",
                      }
                      return (
                        <div
                          key={i}
                          className={cn(
                            "aspect-square rounded flex items-center justify-center text-[10px] font-mono text-white/80",
                            colors[score as keyof typeof colors] || "bg-surface-3"
                          )}
                          title={`${day.date}: ${score}分`}
                        >
                          {score}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-text-muted">
                    <span>4 周前</span>
                    <span>今天</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cycle Annotations */}
          <div className="bg-surface-1 rounded-xl border border-border-default p-4 overflow-hidden">
            <h3 className="text-sm font-medium text-text-primary mb-3">周期标注</h3>
            <div className="space-y-2">
              {[
                { date: "3月1日", event: "Mesocycle 2 开始", type: "cycle" },
                { date: "3月8日", event: "计划调整: 增加腿部训练频次", type: "adjustment" },
                { date: "3月15日", event: "Deload 周", type: "deload" },
                { date: "3月22日", event: "当前", type: "current" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg",
                    item.type === "current" ? "bg-accent/10" : "bg-surface-2"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0 mt-1.5",
                      item.type === "cycle" && "bg-accent",
                      item.type === "adjustment" && "bg-warning",
                      item.type === "deload" && "bg-info",
                      item.type === "current" && "bg-success animate-pulse"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-text-muted block">{item.date}</span>
                    <span className="text-sm text-text-primary">{item.event}</span>
                  </div>
                  {item.type !== "current" && (
                    <ChevronRight className="w-4 h-4 text-text-muted shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <BottomNav />
      </main>
    </div>
  )
}
