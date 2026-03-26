"use client"

import { cn } from "@/lib/utils"
import { Moon, Sunrise, Clock, BedDouble } from "lucide-react"

interface SleepData {
  score: number
  bedTime: string
  wakeTime: string
  duration: string
  deepSleepPercent: number
  weeklyData: { day: string; hours: number }[]
}

export function SleepPanel({ score, bedTime, wakeTime, duration, deepSleepPercent, weeklyData }: SleepData) {
  const scoreColor = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-danger"
  const scoreBgColor = score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-danger"
  const threshold = 7 // hours

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <h3 className="text-sm font-medium text-text-primary">睡眠 & 恢复</h3>
      </div>

      <div className="p-4">
        {/* Score Circle */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                strokeWidth="4"
                className="stroke-surface-3"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 176} 176`}
                className={scoreBgColor}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-lg font-bold font-mono", scoreColor)}>{score}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary mb-1">睡眠质量评分</p>
            <p className="text-xs text-text-muted">
              {score >= 80 ? "优秀，继续保持！" : score >= 60 ? "良好，还有提升空间" : "需要改善睡眠习惯"}
            </p>
          </div>
        </div>

        {/* Sleep Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
            <Moon className="w-4 h-4 text-text-muted" />
            <div>
              <p className="text-[10px] text-text-muted">入睡</p>
              <p className="text-sm font-mono text-text-primary">{bedTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
            <Sunrise className="w-4 h-4 text-text-muted" />
            <div>
              <p className="text-[10px] text-text-muted">起床</p>
              <p className="text-sm font-mono text-text-primary">{wakeTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
            <Clock className="w-4 h-4 text-text-muted" />
            <div>
              <p className="text-[10px] text-text-muted">时长</p>
              <p className="text-sm font-mono text-text-primary">{duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
            <BedDouble className="w-4 h-4 text-text-muted" />
            <div>
              <p className="text-[10px] text-text-muted">深睡</p>
              <p className="text-sm font-mono text-text-primary">{deepSleepPercent}%</p>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div>
          <p className="text-xs text-text-muted mb-2">近 7 日睡眠时长</p>
          <div className="flex items-end justify-between gap-1 h-16">
            {weeklyData.map((day, index) => {
              const height = (day.hours / 10) * 100
              const isLow = day.hours < threshold

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      isLow ? "bg-danger" : "bg-accent"
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-text-muted">{day.day}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
