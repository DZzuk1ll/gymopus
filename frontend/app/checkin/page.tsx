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
import { CalendarDays, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { useState } from "react"

// Mock data
const todayExercises = [
  {
    id: "1",
    name: "杠铃深蹲",
    nameEn: "Barbell Back Squat",
    sets: [
      { setNumber: 1, targetReps: "8", targetWeight: "100", actualReps: "", actualWeight: "", rpe: "" },
      { setNumber: 2, targetReps: "8", targetWeight: "100", actualReps: "", actualWeight: "", rpe: "" },
      { setNumber: 3, targetReps: "6", targetWeight: "110", actualReps: "", actualWeight: "", rpe: "" },
      { setNumber: 4, targetReps: "6", targetWeight: "110", actualReps: "", actualWeight: "", rpe: "" },
    ],
  },
  {
    id: "2",
    name: "罗马尼亚硬拉",
    nameEn: "Romanian Deadlift",
    sets: [
      { setNumber: 1, targetReps: "10", targetWeight: "80", actualReps: "", actualWeight: "", rpe: "" },
      { setNumber: 2, targetReps: "10", targetWeight: "80", actualReps: "", actualWeight: "", rpe: "" },
      { setNumber: 3, targetReps: "8", targetWeight: "85", actualReps: "", actualWeight: "", rpe: "" },
    ],
  },
  {
    id: "3",
    name: "腿举",
    nameEn: "Leg Press",
    sets: [
      { setNumber: 1, targetReps: "12", targetWeight: "180", actualReps: "", actualWeight: "", rpe: "" },
      { setNumber: 2, targetReps: "12", targetWeight: "180", actualReps: "", actualWeight: "", rpe: "" },
      { setNumber: 3, targetReps: "10", targetWeight: "200", actualReps: "", actualWeight: "", rpe: "" },
    ],
  },
]

const defaultMeals = [
  { id: "1", name: "早餐", items: [] },
  { id: "2", name: "午餐", items: [] },
  { id: "3", name: "晚餐", items: [] },
  { id: "4", name: "加餐", items: [] },
]

const supplements = [
  { id: "1", name: "肌酸", dosage: "5g", time: "训练前", taken: false },
  { id: "2", name: "乳清蛋白", dosage: "30g", time: "训练后", taken: false },
  { id: "3", name: "维生素D3", dosage: "2000IU", time: "早餐后", taken: false },
  { id: "4", name: "鱼油", dosage: "2粒", time: "晚餐后", taken: false },
]

export default function CheckinPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
    setSaved(false)
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
  }

  // Calculate progress (mock)
  const completedModules = 2
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

          {/* Modules */}
          <div className="space-y-4">
            <TrainingModule exercises={todayExercises} />
            <NutritionModule
              meals={defaultMeals}
              targets={{ calories: 2800, protein: 160, carbs: 350, fat: 80 }}
            />
            <SleepModule />
            <SupplementsModule supplements={supplements} />
            <MoodModule />
            <BodyMetricsModule />
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
        </div>

        <BottomNav />
      </main>
    </div>
  )
}
