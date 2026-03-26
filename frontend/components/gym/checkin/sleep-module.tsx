"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Moon, Sunrise } from "lucide-react"
import { useState } from "react"

interface SleepModuleProps {
  initialData?: {
    bedTime: string
    wakeTime: string
    quality: number
    awakenings: number
  }
}

export function SleepModule({ initialData }: SleepModuleProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [data, setData] = useState({
    bedTime: initialData?.bedTime || "",
    wakeTime: initialData?.wakeTime || "",
    quality: initialData?.quality || 3,
    awakenings: initialData?.awakenings || 0,
  })

  const calculateDuration = () => {
    if (!data.bedTime || !data.wakeTime) return null
    const [bedHour, bedMin] = data.bedTime.split(":").map(Number)
    const [wakeHour, wakeMin] = data.wakeTime.split(":").map(Number)
    
    let bedMinutes = bedHour * 60 + bedMin
    let wakeMinutes = wakeHour * 60 + wakeMin
    
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60
    }
    
    const duration = wakeMinutes - bedMinutes
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    
    return { hours, minutes, total: duration / 60 }
  }

  const duration = calculateDuration()
  const qualityLabels = ["", "很差", "较差", "一般", "良好", "很好"]
  const isComplete = data.bedTime && data.wakeTime

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">睡眠记录</h3>
          {isComplete && duration && (
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded",
              duration.total >= 7 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
            )}>
              {duration.hours}h {duration.minutes}m
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border-default p-4 space-y-4">
          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs text-text-muted mb-2">
                <Moon className="w-3.5 h-3.5" />
                入睡时间
              </label>
              <input
                type="time"
                value={data.bedTime}
                onChange={(e) => setData({ ...data, bedTime: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs text-text-muted mb-2">
                <Sunrise className="w-3.5 h-3.5" />
                起床时间
              </label>
              <input
                type="time"
                value={data.wakeTime}
                onChange={(e) => setData({ ...data, wakeTime: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary"
              />
            </div>
          </div>

          {/* Duration Display */}
          {duration && (
            <div className="p-3 bg-surface-2 rounded-lg">
              <p className="text-xs text-text-muted mb-1">计算时长</p>
              <p className={cn(
                "text-lg font-semibold font-mono",
                duration.total >= 7 ? "text-success" : duration.total >= 6 ? "text-warning" : "text-danger"
              )}>
                {duration.hours} 小时 {duration.minutes} 分钟
              </p>
            </div>
          )}

          {/* Quality Slider */}
          <div>
            <label className="text-xs text-text-muted mb-2 block">
              睡眠质量: <span className="text-text-primary font-medium">{qualityLabels[data.quality]}</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setData({ ...data, quality: level })}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-colors border",
                    data.quality === level
                      ? level <= 2
                        ? "bg-danger/15 border-danger text-danger"
                        : level === 3
                        ? "bg-warning/15 border-warning text-warning"
                        : "bg-success/15 border-success text-success"
                      : "bg-surface-2 border-border-default text-text-muted hover:bg-surface-3"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Awakenings */}
          <div>
            <label className="text-xs text-text-muted mb-2 block">夜间醒来次数</label>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setData({ ...data, awakenings: count })}
                  className={cn(
                    "w-10 h-10 text-sm font-mono rounded-lg transition-colors border",
                    data.awakenings === count
                      ? "bg-accent/15 border-accent text-accent"
                      : "bg-surface-2 border-border-default text-text-muted hover:bg-surface-3"
                  )}
                >
                  {count === 4 ? "4+" : count}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
