"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Smile, Meh, Frown, Laugh, Angry } from "lucide-react"
import { useState, useEffect } from "react"

interface MoodModuleProps {
  initialMood?: number
  initialNote?: string
  onMoodChange?: (data: { level: number; description: string }) => void
}

const moodOptions = [
  { level: 1, icon: Angry, label: "很差", color: "text-danger", bg: "bg-danger/15", border: "border-danger" },
  { level: 2, icon: Frown, label: "较差", color: "text-warning", bg: "bg-warning/15", border: "border-warning" },
  { level: 3, icon: Meh, label: "一般", color: "text-text-secondary", bg: "bg-surface-3", border: "border-text-secondary" },
  { level: 4, icon: Smile, label: "良好", color: "text-success", bg: "bg-success/15", border: "border-success" },
  { level: 5, icon: Laugh, label: "很好", color: "text-accent", bg: "bg-accent/15", border: "border-accent" },
]

export function MoodModule({ initialMood, initialNote, onMoodChange }: MoodModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedMood, setSelectedMood] = useState(initialMood || 0)
  const [note, setNote] = useState(initialNote || "")

  useEffect(() => {
    if (selectedMood > 0) onMoodChange?.({ level: selectedMood, description: note })
  }, [selectedMood, note])

  const selectedMoodInfo = moodOptions.find((m) => m.level === selectedMood)

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">情绪与主观感受</h3>
          {selectedMoodInfo && (
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded",
              selectedMoodInfo.bg,
              selectedMoodInfo.color
            )}>
              {selectedMoodInfo.label}
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
          {/* Mood Selection */}
          <div>
            <label className="text-xs text-text-muted mb-3 block">今日情绪</label>
            <div className="flex gap-2">
              {moodOptions.map((mood) => {
                const Icon = mood.icon
                const isSelected = selectedMood === mood.level

                return (
                  <button
                    key={mood.level}
                    onClick={() => setSelectedMood(mood.level)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? cn(mood.bg, mood.border, mood.color)
                        : "bg-surface-2 border-transparent hover:bg-surface-3"
                    )}
                  >
                    <Icon className={cn("w-6 h-6", isSelected ? mood.color : "text-text-muted")} />
                    <span className={cn("text-xs font-medium", isSelected ? mood.color : "text-text-muted")}>
                      {mood.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-text-muted mb-2 block">今日体感 (可选)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="简单描述今天的状态"
              className="w-full px-3 py-2 text-sm bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted resize-none h-20"
            />
          </div>
        </div>
      )}
    </div>
  )
}
