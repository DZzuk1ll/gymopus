"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar } from "@/components/gym/top-bar"
import { TrainingModule } from "@/components/gym/checkin/training-module"
import { NutritionModule } from "@/components/gym/checkin/nutrition-module"
import { SleepModule } from "@/components/gym/checkin/sleep-module"
import { SupplementsModule } from "@/components/gym/checkin/supplements-module"
import { MoodModule } from "@/components/gym/checkin/mood-module"
import { BodyMetricsModule } from "@/components/gym/checkin/body-metrics-module"
import { Button } from "@/components/ui/button"
import { CalendarDays, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { apiFetch, getStoredUserId } from "@/lib/api"

const CHECKIN_STORAGE_KEY = "gymops_checkin_draft"

function loadCheckinDraft(dateStr: string) {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(CHECKIN_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.date === dateStr ? data : null
  } catch { return null }
}

function clearCheckinDraft() {
  sessionStorage.removeItem(CHECKIN_STORAGE_KEY)
}

interface Exercise {
  id: string
  name: string
  nameEn: string
  planned: string
  completed: boolean
}

interface TrainingData {
  exercises: Exercise[]
  overallRpe: number
  durationMin: string
  notes: string
}

interface Meal {
  id: string
  name: string
  description: string
}

interface Supplement {
  id: string
  name: string
  dosage: string
  time: string
  taken: boolean
}

const DEFAULT_MEALS: Meal[] = [
  { id: "1", name: "早餐", description: "" },
  { id: "2", name: "午餐", description: "" },
  { id: "3", name: "晚餐", description: "" },
  { id: "4", name: "加餐", description: "" },
]

export default function CheckinPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Module data (all as state so we can persist to sessionStorage)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null)
  const [meals, setMeals] = useState<Meal[]>(DEFAULT_MEALS)
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [sleepData, setSleepData] = useState<{ bedTime: string; wakeTime: string; quality: number; awakenings: number } | null>(null)
  const [moodData, setMoodData] = useState<{ level: number; description: string } | null>(null)
  const [metricsData, setMetricsData] = useState<{ weight: string | number; bodyFat: string | number; chest: string | number; waist: string | number; arm: string | number } | null>(null)

  // Initial data for pre-populating modules
  const [initSleep, setInitSleep] = useState<{ bedTime: string; wakeTime: string; quality: number; awakenings: number } | undefined>()
  const [initMood, setInitMood] = useState<number | undefined>()
  const [initNote, setInitNote] = useState<string | undefined>()
  const [initMetrics, setInitMetrics] = useState<{ weight?: number; bodyFat?: number; chest?: number; waist?: number; arm?: number } | undefined>()

  // Persist draft to sessionStorage
  const dateStr = selectedDate.toISOString().slice(0, 10)
  useEffect(() => {
    if (loading || saved) return
    const draft = {
      date: dateStr,
      exercises, trainingData, meals, supplements, sleepData, moodData, metricsData,
    }
    sessionStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(draft))
  }, [exercises, trainingData, meals, supplements, sleepData, moodData, metricsData, dateStr, loading, saved])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  }

  const formatDateStr = (date: Date) => {
    return date.toISOString().slice(0, 10)
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
    setSaved(false)
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Fetch plan exercises and existing checkin data
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError("")
      const userId = getStoredUserId()
      if (!userId) {
        setLoading(false)
        return
      }

      const dateStr = formatDateStr(selectedDate)

      try {
        // Fetch user's active plan
        const plans = await apiFetch<any[]>(`/api/v1/plans?user_id=${userId}`).catch(() => [])
        const activePlan = plans[0]

        if (activePlan) {
          // Fetch today's planned workout
          const todayWorkout = await apiFetch<any>(`/api/v1/plans/${activePlan.id}/today`).catch(() => null)
          if (todayWorkout?.plan_day?.exercises?.length) {
            const planExercises: Exercise[] = todayWorkout.plan_day.exercises.map((ex: any) => ({
              id: ex.id,
              name: ex.exercise_name,
              nameEn: ex.exercise_name_en || "",
              planned: `${ex.sets}×${ex.reps_range}${ex.target_weight ? " @" + ex.target_weight : ""}`,
              completed: false,
            }))
            setExercises(planExercises)
          } else {
            setExercises([])
          }
        }

        // Fetch existing checkin for this date
        const checkin = await apiFetch<any>(`/api/v1/checkins/${userId}/${dateStr}`).catch(() => null)
        if (checkin) {
          // Pre-populate training (mark exercises as completed)
          if (checkin.training?.exercises?.length) {
            setExercises((prev) => prev.map((ex) => ({
              ...ex,
              completed: checkin.training.exercises.some((ce: any) => ce.plan_exercise_id === ex.id || ce.exercise_name === ex.name),
            })))
          }

          // Pre-populate nutrition
          if (checkin.nutrition?.meals?.length) {
            setMeals(checkin.nutrition.meals.map((m: any, i: number) => ({
              id: (i + 1).toString(),
              name: m.meal_name || `餐 ${i + 1}`,
              description: (m.items || []).map((item: any) => item.name).filter(Boolean).join("、") || "",
            })))
          }

          // Pre-populate sleep
          if (checkin.sleep) {
            setInitSleep({
              bedTime: checkin.sleep.bed_time || "",
              wakeTime: checkin.sleep.wake_time || "",
              quality: checkin.sleep.quality_score || 3,
              awakenings: 0,
            })
          }

          // Pre-populate supplements
          if (checkin.supplements?.items?.length) {
            setSupplements(checkin.supplements.items.map((s: any, i: number) => ({
              id: i.toString(),
              name: s.name || "",
              dosage: s.dosage || "",
              time: s.time || "",
              taken: s.taken ?? false,
            })))
          }

          // Pre-populate mood
          if (checkin.mood) {
            setInitMood(checkin.mood.level)
            setInitNote(checkin.mood.description || "")
          }

          // Pre-populate body metrics
          if (checkin.body_metrics) {
            setInitMetrics({
              weight: checkin.body_metrics.weight_kg,
              bodyFat: checkin.body_metrics.body_fat_pct,
              chest: checkin.body_metrics.chest_cm,
              waist: checkin.body_metrics.waist_cm,
              arm: checkin.body_metrics.arm_cm,
            })
          }

          setSaved(true)
        } else {
          // No saved checkin — try to restore from sessionStorage draft
          const draft = loadCheckinDraft(dateStr)
          if (draft) {
            if (draft.exercises?.length) setExercises(draft.exercises)
            if (draft.trainingData) setTrainingData(draft.trainingData)
            if (draft.meals?.length) setMeals(draft.meals)
            if (draft.supplements?.length) setSupplements(draft.supplements)
            if (draft.sleepData) {
              setSleepData(draft.sleepData)
              setInitSleep(draft.sleepData)
            }
            if (draft.moodData) {
              setMoodData(draft.moodData)
              setInitMood(draft.moodData.level)
              setInitNote(draft.moodData.description)
            }
            if (draft.metricsData) {
              setMetricsData(draft.metricsData)
              setInitMetrics(draft.metricsData)
            }
          } else {
            setMeals(DEFAULT_MEALS)
            setSupplements([])
            setInitSleep(undefined)
            setInitMood(undefined)
            setInitNote(undefined)
            setInitMetrics(undefined)
          }
          setSaved(false)
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedDate])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    const userId = getStoredUserId()
    if (!userId) {
      setError("请先在设置页创建用户")
      setSaving(false)
      return
    }

    const dateStr = formatDateStr(selectedDate)
    const sleep = sleepData
    const mood = moodData
    const metrics = metricsData

    try {
      await apiFetch("/api/v1/checkins", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          date: dateStr,
          training: exercises.some((ex) => ex.completed) ? {
            duration_min: parseInt(trainingData?.durationMin || "") || undefined,
            overall_rpe: trainingData?.overallRpe || undefined,
            exercises: exercises.filter((ex) => ex.completed).map((ex) => ({
              plan_exercise_id: ex.id,
              exercise_name: ex.name,
              sets: [],
            })),
          } : undefined,
          nutrition: meals.some((m) => m.description.trim()) ? {
            meals: meals.filter((m) => m.description.trim()).map((m) => ({
              meal_name: m.name,
              items: [{ name: m.description }],
            })),
          } : undefined,
          sleep: sleep?.bedTime && sleep?.wakeTime ? {
            bed_time: sleep.bedTime,
            wake_time: sleep.wakeTime,
            quality_score: sleep.quality,
          } : undefined,
          supplements: supplements.length > 0 ? {
            items: supplements.map((s) => ({
              name: s.name,
              dosage: s.dosage,
              time: s.time,
              taken: s.taken,
            })),
          } : undefined,
          mood: mood && mood.level > 0 ? {
            level: mood.level,
            description: mood.description || undefined,
          } : undefined,
          body_metrics: metrics && (metrics.weight || metrics.bodyFat) ? {
            weight_kg: parseFloat(String(metrics.weight)) || undefined,
            body_fat_pct: parseFloat(String(metrics.bodyFat)) || undefined,
            chest_cm: parseFloat(String(metrics.chest)) || undefined,
            waist_cm: parseFloat(String(metrics.waist)) || undefined,
            arm_cm: parseFloat(String(metrics.arm)) || undefined,
          } : undefined,
        }),
      })
      setSaved(true)
      clearCheckinDraft()
    } catch (e: any) {
      setError(e.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  // Calculate progress dynamically
  const completedModules = [
    exercises.some((ex) => ex.completed),
    meals.some((m) => m.description.trim()),
    sleepData?.bedTime && sleepData?.wakeTime,
    supplements.some((s) => s.taken),
    moodData && moodData.level > 0,
    metricsData && (metricsData.weight || metricsData.bodyFat),
  ].filter(Boolean).length
  const totalModules = 6

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 lg:ml-[240px] min-w-0">
        <TopBar title="每日打卡" showDate={false} />

        <div className="p-4 lg:p-6 pb-40 lg:pb-6 space-y-4 max-w-full">
          {/* Date Selector & Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-1 rounded-xl border border-border-default">
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-text-muted" />
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg">
                <CalendarDays className="w-4 h-4 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">{formatDate(selectedDate)}</span>
                {isToday && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-accent/15 text-accent rounded">
                    今天
                  </span>
                )}
              </div>
              <button
                onClick={() => changeDate(1)}
                disabled={isToday}
                className="p-2 hover:bg-surface-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 sm:w-40">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>打卡进度</span>
                  <span>{completedModules}/{totalModules} 项</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${(completedModules / totalModules) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Modules */}
              <div className="space-y-4">
                <TrainingModule exercises={exercises} onTrainingChange={(data) => { setTrainingData(data); setExercises(data.exercises) }} />
                <NutritionModule
                  meals={meals}
                  onMealsChange={setMeals}
                />
                <SleepModule
                  initialData={initSleep}
                  onSleepChange={setSleepData}
                />
                <SupplementsModule
                  supplements={supplements}
                  onSupplementsChange={setSupplements}
                />
                <MoodModule
                  initialMood={initMood}
                  initialNote={initNote}
                  onMoodChange={setMoodData}
                />
                <BodyMetricsModule
                  initialData={initMetrics}
                  onMetricsChange={setMetricsData}
                />
              </div>

              {/* Save Button - Fixed at bottom on mobile */}
              <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent lg:relative lg:bottom-auto lg:p-0 lg:bg-none">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 gap-2 bg-accent hover:bg-accent-hover text-accent-foreground text-base font-medium shadow-lg lg:shadow-none"
                >
                  {saving ? (
                    "保存中..."
                  ) : saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      已保存
                    </>
                  ) : (
                    "保存今日记录"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <BottomNav />
      </main>
    </div>
  )
}
