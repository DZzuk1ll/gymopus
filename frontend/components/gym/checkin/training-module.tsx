"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Dumbbell } from "lucide-react"
import { useState, useEffect } from "react"

interface Exercise {
  id: string
  name: string
  nameEn: string
  planned: string      // e.g. "4×6-8 @100kg"
  completed: boolean
}

interface TrainingData {
  exercises: Exercise[]
  overallRpe: number
  durationMin: string
  notes: string
}

interface TrainingModuleProps {
  exercises: Exercise[]
  onTrainingChange?: (data: TrainingData) => void
}

export function TrainingModule({ exercises: initial, onTrainingChange }: TrainingModuleProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [exercises, setExercises] = useState(initial)
  const [overallRpe, setOverallRpe] = useState(0)
  const [durationMin, setDurationMin] = useState("")
  const [notes, setNotes] = useState("")

  // Sync when initial exercises change (date change / API load)
  useEffect(() => { setExercises(initial) }, [initial])

  useEffect(() => {
    onTrainingChange?.({ exercises, overallRpe, durationMin, notes })
  }, [exercises, overallRpe, durationMin, notes])

  const toggleExercise = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, completed: !ex.completed } : ex))
    )
  }

  const toggleAll = () => {
    const allDone = exercises.every((ex) => ex.completed)
    setExercises((prev) => prev.map((ex) => ({ ...ex, completed: !allDone })))
  }

  const completedCount = exercises.filter((ex) => ex.completed).length

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">训练记录</h3>
          {exercises.length > 0 && (
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded",
              completedCount === exercises.length && exercises.length > 0
                ? "bg-success/15 text-success"
                : "bg-accent/15 text-accent"
            )}>
              {completedCount}/{exercises.length} 个动作
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
        <div className="border-t border-border-default">
          {exercises.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Dumbbell className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">今日无计划训练</p>
            </div>
          ) : (
            <>
              {/* Select all */}
              <button
                onClick={toggleAll}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs text-text-muted hover:bg-surface-2 transition-colors border-b border-border-default"
              >
                {exercises.every((ex) => ex.completed) ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                全部完成
              </button>

              {/* Exercise checklist */}
              <div className="divide-y divide-border-default">
                {exercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => toggleExercise(ex.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                      ex.completed ? "bg-success/5" : "hover:bg-surface-2"
                    )}
                  >
                    {ex.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-text-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        ex.completed ? "text-text-muted line-through" : "text-text-primary"
                      )}>
                        {ex.name}
                      </p>
                      <p className="text-xs text-text-muted">{ex.nameEn}</p>
                    </div>
                    <span className="text-xs font-mono text-text-muted shrink-0">
                      {ex.planned}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Overall RPE + Duration + Notes */}
          <div className="p-4 bg-surface-2 space-y-3 border-t border-border-default">
            <div className="flex gap-4">
              {/* Overall RPE */}
              <div className="flex-1">
                <label className="text-xs text-text-muted mb-2 block">
                  整体 RPE {overallRpe > 0 && <span className="text-accent">{overallRpe}</span>}
                </label>
                <div className="flex gap-1">
                  {[5, 6, 7, 8, 9, 10].map((v) => (
                    <button
                      key={v}
                      onClick={() => setOverallRpe(v)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-mono rounded transition-colors",
                        overallRpe === v
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface-3 text-text-muted hover:bg-surface-1"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="w-24 shrink-0">
                <label className="text-xs text-text-muted mb-2 block">时长</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    placeholder="60"
                    className="w-full px-2 py-1.5 text-sm font-mono bg-surface-3 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                  />
                  <span className="text-xs text-text-muted">分</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-text-muted mb-1 block">备注 (可选)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="状态不错 / 左肩有点不舒服 / ..."
                className="w-full px-3 py-1.5 text-sm bg-surface-3 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
