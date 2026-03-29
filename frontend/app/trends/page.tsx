"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar } from "@/components/gym/top-bar"
import { TrendChart } from "@/components/gym/trends/trend-chart"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { apiFetch, getStoredUserId } from "@/lib/api"
import { Dumbbell, Scale, Flame, Moon, Heart, ChevronRight, Loader2 } from "lucide-react"

interface DataPoint {
  date: string
  value: number | null
}

interface TrendsResponse {
  range_days: number
  start_date: string
  end_date: string
  training: { daily_volume: DataPoint[]; weekly_volume: DataPoint[]; weekly_volume_target: number | null } | null
  body: { daily_weight: DataPoint[]; target_weight: number | null } | null
  nutrition: { daily_calories: DataPoint[]; daily_protein: DataPoint[]; targets: Record<string, number> } | null
  sleep: { daily_duration: DataPoint[]; daily_quality: DataPoint[]; target_duration: number } | null
  mood: { daily_level: DataPoint[] } | null
  cycle_annotations: { date: string; event: string; type: string }[]
}

const timeRanges = [
  { label: "7 天", days: 7 },
  { label: "30 天", days: 30 },
  { label: "90 天", days: 90 },
]

const dimensionOptions = [
  { id: "all", label: "全部", icon: null },
  { id: "training", label: "训练", icon: Dumbbell },
  { id: "body", label: "身体指标", icon: Scale },
  { id: "nutrition", label: "营养", icon: Flame },
  { id: "sleep", label: "睡眠", icon: Moon },
  { id: "mood", label: "情绪", icon: Heart },
]

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
}

function toChartData(points: DataPoint[] | undefined): { date: string; value: number }[] {
  if (!points) return []
  return points
    .filter((p) => p.value != null)
    .map((p) => ({ date: formatDateLabel(p.date), value: p.value! }))
}

export default function TrendsPage() {
  const [selectedRange, setSelectedRange] = useState(30)
  const [selectedDimension, setSelectedDimension] = useState("all")
  const [trendData, setTrendData] = useState<TrendsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrends() {
      const userId = getStoredUserId()
      if (!userId) { setLoading(false); return }
      setLoading(true)
      try {
        const data = await apiFetch<TrendsResponse>(
          `/api/v1/trends/${userId}?range=${selectedRange}&dimensions=${selectedDimension}`
        )
        setTrendData(data)
      } catch { }
      finally { setLoading(false) }
    }
    fetchTrends()
  }, [selectedRange, selectedDimension])

  const showChart = (dimension: string) => {
    return selectedDimension === "all" || selectedDimension === dimension
  }

  const annotations = trendData?.cycle_annotations
    ?.filter((a) => a.type !== "current")
    .map((a) => ({ date: formatDateLabel(a.date), label: a.event })) || []

  const hasNoData = !loading && trendData && !trendData.training && !trendData.body && !trendData.nutrition && !trendData.sleep && !trendData.mood

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
                {dimensionOptions.map((dim) => {
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

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : hasNoData ? (
            <div className="text-center py-16">
              <Scale className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary">暂无趋势数据</p>
              <p className="text-xs text-text-muted mt-1">开始每日打卡后，趋势图表将在此展示</p>
            </div>
          ) : (
            <>
              {/* Charts */}
              <div className="space-y-4">
                {/* Training */}
                {showChart("training") && trendData?.training && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-accent" />
                      <h2 className="text-sm font-medium text-text-primary">训练趋势</h2>
                    </div>
                    <TrendChart
                      title="周训练容量"
                      data={toChartData(trendData.training.weekly_volume.length > 0 ? trendData.training.weekly_volume : trendData.training.daily_volume)}
                      unit="kg"
                      targetValue={trendData.training.weekly_volume_target || undefined}
                      color="accent"
                      annotations={annotations}
                    />
                  </div>
                )}

                {/* Body */}
                {showChart("body") && trendData?.body && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-success" />
                      <h2 className="text-sm font-medium text-text-primary">身体指标趋势</h2>
                    </div>
                    <TrendChart
                      title="体重"
                      data={toChartData(trendData.body.daily_weight)}
                      unit="kg"
                      targetValue={trendData.body.target_weight || undefined}
                      color="success"
                    />
                  </div>
                )}

                {/* Nutrition */}
                {showChart("nutrition") && trendData?.nutrition && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-warning" />
                      <h2 className="text-sm font-medium text-text-primary">营养趋势</h2>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-4">
                      <TrendChart
                        title="日均热量摄入"
                        data={toChartData(trendData.nutrition.daily_calories)}
                        unit="kcal"
                        targetValue={trendData.nutrition.targets?.calories}
                        color="warning"
                      />
                      <TrendChart
                        title="日均蛋白质摄入"
                        data={toChartData(trendData.nutrition.daily_protein)}
                        unit="g"
                        targetValue={trendData.nutrition.targets?.protein}
                        color="accent"
                      />
                    </div>
                  </div>
                )}

                {/* Sleep */}
                {showChart("sleep") && trendData?.sleep && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-info" />
                      <h2 className="text-sm font-medium text-text-primary">睡眠趋势</h2>
                    </div>
                    <TrendChart
                      title="日均睡眠时长"
                      data={toChartData(trendData.sleep.daily_duration)}
                      unit="小时"
                      targetValue={trendData.sleep.target_duration}
                      color="accent"
                    />
                  </div>
                )}

                {/* Mood */}
                {showChart("mood") && trendData?.mood && (
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
                        {toChartData(trendData.mood.daily_level).slice(-28).map((day, i) => {
                          const score = Math.round(day.value)
                          const colors: Record<number, string> = {
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
                                colors[score] || "bg-surface-3"
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
              {trendData?.cycle_annotations && trendData.cycle_annotations.length > 0 && (
                <div className="bg-surface-1 rounded-xl border border-border-default p-4 overflow-hidden">
                  <h3 className="text-sm font-medium text-text-primary mb-3">周期标注</h3>
                  <div className="space-y-2">
                    {trendData.cycle_annotations.map((item, i) => (
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
                          <span className="text-xs font-mono text-text-muted block">{formatDateLabel(item.date)}</span>
                          <span className="text-sm text-text-primary">{item.event}</span>
                        </div>
                        {item.type !== "current" && (
                          <ChevronRight className="w-4 h-4 text-text-muted shrink-0 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <BottomNav />
      </main>
    </div>
  )
}
