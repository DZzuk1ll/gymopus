"use client"

import { cn } from "@/lib/utils"
import { 
  Smile, 
  Meh, 
  Frown, 
  Laugh, 
  Angry,
  Check,
  Clock as ClockIcon
} from "lucide-react"
import { useState } from "react"

interface MoodData {
  level: 1 | 2 | 3 | 4 | 5
  description: string
  weeklyHistory: (1 | 2 | 3 | 4 | 5)[]
}

interface Supplement {
  id: string
  name: string
  dosage: string
  time: string
  taken: boolean
}

interface MoodSupplementsPanelProps {
  mood: MoodData
  supplements: Supplement[]
}

const moodConfig = {
  1: { icon: Angry, label: "很差", color: "text-danger", bg: "bg-danger" },
  2: { icon: Frown, label: "较差", color: "text-warning", bg: "bg-warning" },
  3: { icon: Meh, label: "一般", color: "text-text-secondary", bg: "bg-text-secondary" },
  4: { icon: Smile, label: "良好", color: "text-success", bg: "bg-success" },
  5: { icon: Laugh, label: "很好", color: "text-accent", bg: "bg-accent" },
}

export function MoodSupplementsPanel({ mood, supplements: initialSupplements }: MoodSupplementsPanelProps) {
  const [supplements, setSupplements] = useState(initialSupplements)
  const MoodIcon = moodConfig[mood.level].icon
  const moodInfo = moodConfig[mood.level]

  const toggleSupplement = (id: string) => {
    setSupplements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, taken: !s.taken } : s))
    )
  }

  const takenCount = supplements.filter((s) => s.taken).length

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <h3 className="text-sm font-medium text-text-primary">情绪 & 补剂</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Today's Mood */}
        <div>
          <p className="text-xs text-text-muted mb-2">今日情绪</p>
          <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
            <div className={cn("p-2 rounded-lg bg-surface-3", moodInfo.color)}>
              <MoodIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-medium", moodInfo.color)}>{moodInfo.label}</p>
              <p className="text-xs text-text-muted">{mood.description}</p>
            </div>
          </div>
        </div>

        {/* Weekly Mood History */}
        <div>
          <p className="text-xs text-text-muted mb-2">近 7 日情绪</p>
          <div className="flex gap-1.5">
            {mood.weeklyHistory.map((level, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 h-6 rounded",
                  moodConfig[level].bg,
                  level <= 2 && "opacity-80"
                )}
                title={moodConfig[level].label}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-text-muted">周一</span>
            <span className="text-[10px] text-text-muted">今天</span>
          </div>
        </div>

        {/* Supplements */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted">今日补剂</p>
            <p className="text-xs text-text-muted">{takenCount}/{supplements.length} 已服用</p>
          </div>
          <div className="space-y-2">
            {supplements.map((supplement) => (
              <button
                key={supplement.id}
                onClick={() => toggleSupplement(supplement.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                  supplement.taken ? "bg-success/10" : "bg-surface-2 hover:bg-surface-3"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded border-2 transition-colors",
                    supplement.taken
                      ? "bg-success border-success"
                      : "border-border-hover"
                  )}
                >
                  {supplement.taken && <Check className="w-3 h-3 text-success-foreground" />}
                </div>
                <div className="flex-1 text-left">
                  <p className={cn("text-sm", supplement.taken ? "text-text-muted line-through" : "text-text-primary")}>
                    {supplement.name}
                  </p>
                  <p className="text-xs text-text-muted">{supplement.dosage}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <ClockIcon className="w-3 h-3" />
                  <span>{supplement.time}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
