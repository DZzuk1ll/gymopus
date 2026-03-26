"use client"

import { cn } from "@/lib/utils"
import { Clock, Flame, Target, CheckCircle2, Circle } from "lucide-react"
import { useState } from "react"

interface Exercise {
  id: string
  name: string
  nameEn: string
  sets: number
  reps: string
  weight: string
  rpe: string
  completed?: boolean
}

interface TodayWorkoutProps {
  title: string
  duration: string
  exercises: Exercise[]
  summary: {
    totalSets: number
    totalVolume: string
    targetMuscles: string[]
  }
}

export function TodayWorkout({ title, duration, exercises, summary }: TodayWorkoutProps) {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  const toggleExercise = (id: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const completedCount = completedExercises.size

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border-default">
        <h3 className="text-sm font-medium text-text-primary whitespace-nowrap">{title}</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>约{duration}</span>
          </div>
          <span className="text-xs text-text-muted whitespace-nowrap">
            {completedCount}/{exercises.length} 完成
          </span>
        </div>
      </div>

      {/* Exercises */}
      <div className="divide-y divide-border-default">
        {exercises.map((exercise, index) => {
          const isCompleted = completedExercises.has(exercise.id)

          return (
            <div
              key={exercise.id}
              className={cn(
                "px-4 py-3 transition-colors",
                isCompleted && "bg-success/5 opacity-70"
              )}
            >
              {/* Mobile: Stack layout */}
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleExercise(exercise.id)}
                  className="shrink-0 mt-0.5"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-muted hover:text-text-secondary transition-colors" />
                  )}
                </button>

                {/* Index */}
                <span className="shrink-0 w-6 text-sm font-mono text-text-muted mt-0.5">{String(index + 1).padStart(2, "0")}</span>

                {/* Exercise Info & Specs */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className={cn("text-sm font-medium whitespace-nowrap", isCompleted ? "text-text-muted line-through" : "text-text-primary")}>
                      {exercise.name}
                    </p>
                    <p className="text-xs text-text-muted">{exercise.nameEn}</p>
                  </div>
                  {/* Specs - below name on mobile */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className="px-2 py-1 font-mono bg-surface-2 rounded text-text-secondary whitespace-nowrap">
                      {exercise.sets}×{exercise.reps}
                    </span>
                    <span className="px-2 py-1 font-mono bg-surface-2 rounded text-text-secondary whitespace-nowrap">
                      {exercise.weight}
                    </span>
                    <span className="px-2 py-1 font-mono bg-accent/15 rounded text-accent whitespace-nowrap">
                      RPE {exercise.rpe}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-2 border-t border-border-default">
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>总组数 {summary.totalSets}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>总容量 {summary.totalVolume}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {summary.targetMuscles.map((muscle) => (
            <span
              key={muscle}
              className="px-2 py-1 text-[10px] font-medium bg-surface-3 text-text-muted rounded"
            >
              {muscle}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
