"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ExerciseSet {
  setNumber: number
  targetReps: string
  targetWeight: string
  actualReps: string
  actualWeight: string
  rpe: string
}

interface Exercise {
  id: string
  name: string
  nameEn: string
  sets: ExerciseSet[]
}

interface TrainingModuleProps {
  exercises: Exercise[]
  onExercisesChange?: (exercises: Exercise[]) => void
}

export function TrainingModule({ exercises: initialExercises, onExercisesChange }: TrainingModuleProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [exercises, setExercises] = useState(initialExercises)

  const updateSet = (exerciseId: string, setIndex: number, field: keyof ExerciseSet, value: string) => {
    const updated = exercises.map((ex) => {
      if (ex.id === exerciseId) {
        const newSets = [...ex.sets]
        newSets[setIndex] = { ...newSets[setIndex], [field]: value }
        return { ...ex, sets: newSets }
      }
      return ex
    })
    setExercises(updated)
    onExercisesChange?.(updated)
  }

  const totalVolume = exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((setAcc, set) => {
      const reps = parseInt(set.actualReps) || parseInt(set.targetReps) || 0
      const weight = parseFloat(set.actualWeight) || parseFloat(set.targetWeight) || 0
      return setAcc + reps * weight
    }, 0)
  }, 0)

  const completedSets = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((set) => set.actualReps && set.actualWeight).length
  }, 0)

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">训练记录</h3>
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded",
            completedSets === totalSets ? "bg-success/15 text-success" : "bg-accent/15 text-accent"
          )}>
            {completedSets}/{totalSets} 组
          </span>
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
          {exercises.map((exercise, exIndex) => (
            <div key={exercise.id} className="border-b border-border-default last:border-b-0">
              {/* Exercise Header */}
              <div className="px-4 py-3 bg-surface-2">
                <p className="text-sm font-medium text-text-primary whitespace-nowrap">{exercise.name}</p>
                <p className="text-xs text-text-muted">{exercise.nameEn}</p>
              </div>

              {/* Sets - Card layout for mobile */}
              <div className="divide-y divide-border-default">
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="px-4 py-3">
                    {/* Set header row */}
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2">
                      <span className="text-xs font-medium text-text-muted">第 {set.setNumber} 组</span>
                      <span className="text-xs font-mono text-text-muted">
                        目标 {set.targetReps}x{set.targetWeight}kg
                      </span>
                    </div>
                    {/* Input row */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-text-muted mb-1 block">次数</label>
                        <input
                          type="number"
                          value={set.actualReps}
                          onChange={(e) => updateSet(exercise.id, setIndex, "actualReps", e.target.value)}
                          placeholder={set.targetReps}
                          className="w-full px-2 py-1.5 text-sm font-mono bg-surface-2 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-text-muted mb-1 block">重量(kg)</label>
                        <input
                          type="number"
                          value={set.actualWeight}
                          onChange={(e) => updateSet(exercise.id, setIndex, "actualWeight", e.target.value)}
                          placeholder={set.targetWeight}
                          className="w-full px-2 py-1.5 text-sm font-mono bg-surface-2 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                        />
                      </div>
                      <div className="w-14 shrink-0">
                        <label className="text-[10px] text-text-muted mb-1 block">RPE</label>
                        <select
                          value={set.rpe}
                          onChange={(e) => updateSet(exercise.id, setIndex, "rpe", e.target.value)}
                          className="w-full px-1 py-1.5 text-sm font-mono bg-surface-2 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary"
                        >
                          <option value="">-</option>
                          {[5, 6, 7, 8, 9, 10].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add Exercise & Summary */}
          <div className="px-4 py-3 bg-surface-2 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newExercise: Exercise = {
                  id: `ex-${Date.now()}`,
                  name: "新动作",
                  nameEn: "New Exercise",
                  sets: [
                    { setNumber: 1, targetReps: "", targetWeight: "", actualReps: "", actualWeight: "", rpe: "" },
                    { setNumber: 2, targetReps: "", targetWeight: "", actualReps: "", actualWeight: "", rpe: "" },
                    { setNumber: 3, targetReps: "", targetWeight: "", actualReps: "", actualWeight: "", rpe: "" },
                  ],
                }
                const updated = [...exercises, newExercise]
                setExercises(updated)
                onExercisesChange?.(updated)
              }}
              className="gap-1.5 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              添加动作
            </Button>
            <span className="text-xs text-text-secondary">
              总容量: <span className="font-mono text-text-primary">{totalVolume.toLocaleString()}kg</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
