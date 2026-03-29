"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar, DashboardActions } from "@/components/gym/top-bar"
import { StatCard } from "@/components/gym/stat-card"
import { AlertBanner } from "@/components/gym/alert-banner"
import { TrainingPlanCard } from "@/components/gym/training-plan-card"
import { TodayWorkout } from "@/components/gym/today-workout"
import { NutritionPanel } from "@/components/gym/nutrition-panel"
import { SleepPanel } from "@/components/gym/sleep-panel"
import { MoodSupplementsPanel } from "@/components/gym/mood-supplements-panel"
import { FAB } from "@/components/gym/fab"
import { Disclaimer } from "@/components/gym/disclaimer"
import {
  Dumbbell,
  Moon,
  Beef,
  Scale,
  Heart
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiFetch, getStoredUserId } from "@/lib/api"

const DAY_NAMES = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"]
const DAY_SHORTS = ["", "一", "二", "三", "四", "五", "六", "日"]

const goalLabels: Record<string, string> = {
  muscle: "增肌期",
  "fat-loss": "减脂期",
  strength: "力量增长期",
  maintain: "维持期",
}

const splitLabels: Record<string, string> = {
  ppl: "推拉腿",
  "upper-lower": "上下肢",
  "full-body": "全身",
  "bro-split": "单肌群",
}

const WEEKDAY_SHORTS = ["日", "一", "二", "三", "四", "五", "六"]

interface PlanData {
  id: string
  name: string
  goal: string
  split_type: string
  days_per_week: number
  minutes_per_session: number
  total_weeks: number
  current_week: number
  target_calories: number | null
  target_protein: number | null
  target_carbs: number | null
  target_fat: number | null
}

interface WeekDayData {
  id: string
  day_of_week: number
  day_type: string
  label: string | null
  target_muscles: string[]
  estimated_duration: number | null
  exercises: ExerciseData[]
}

interface ExerciseData {
  id: string
  exercise_name: string
  exercise_name_en: string | null
  sets: number
  reps_range: string
  target_weight: string | null
  target_rpe: number | null
}

interface WeekData {
  id: string
  week_number: number
  theme: string | null
  days: WeekDayData[]
}

interface TodayData {
  plan_day: WeekDayData | null
  is_rest_day: boolean
  week_number: number
  day_of_week: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [weekData, setWeekData] = useState<WeekData | null>(null)
  const [todayData, setTodayData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayCheckin, setTodayCheckin] = useState<any>(null)
  const [recentCheckins, setRecentCheckins] = useState<any[]>([])

  useEffect(() => {
    async function fetchDashboardData() {
      const userId = getStoredUserId()
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        // Fetch user's plans, get the latest active one
        const plans: PlanData[] = await apiFetch(`/api/v1/plans?user_id=${userId}`)
        const activePlan = plans.find((p) => p.goal) // first (most recent) plan
        if (activePlan) {
          setPlan(activePlan)
        }

        const today = new Date().toISOString().slice(0, 10)
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

        // Fetch plan details, today's checkin, and recent checkins in parallel
        const fetches: Promise<any>[] = [
          activePlan ? apiFetch<WeekData>(`/api/v1/plans/${activePlan.id}/weeks/${activePlan.current_week}`).catch(() => null) : Promise.resolve(null),
          activePlan ? apiFetch<TodayData>(`/api/v1/plans/${activePlan.id}/today`).catch(() => null) : Promise.resolve(null),
          apiFetch(`/api/v1/checkins/${userId}/${today}`).catch(() => null),
          apiFetch(`/api/v1/checkins/${userId}?start=${weekAgo}&end=${today}`).catch(() => []),
        ]

        const [week, today2, checkin, recent] = await Promise.all(fetches)
        setWeekData(week)
        setTodayData(today2)
        setTodayCheckin(checkin)
        setRecentCheckins(Array.isArray(recent) ? recent : [])
      } catch {
        // API not available or no plans
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  // Compute stats from checkin data
  const weeklyVolume = recentCheckins.reduce((sum, c) => sum + (c.training?.total_volume_kg || 0), 0)
  const sleepDurations = recentCheckins
    .map((c) => c.sleep?.duration_hours)
    .filter((v: any) => v != null) as number[]
  const avgSleep = sleepDurations.length > 0 ? sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length : 0
  const proteinValues = recentCheckins
    .map((c) => c.nutrition?.total_protein)
    .filter((v: any) => v != null) as number[]
  const avgProtein = proteinValues.length > 0 ? Math.round(proteinValues.reduce((a, b) => a + b, 0) / proteinValues.length) : 0
  const latestWeight = [...recentCheckins].reverse().find((c) => c.body_metrics?.weight_kg)?.body_metrics?.weight_kg
  const latestMoodLevel = todayCheckin?.mood?.level

  // Build sleep panel data from checkin data
  const sleepPanelData = (() => {
    const sleep = todayCheckin?.sleep
    const bedTime = sleep?.bed_time || "--:--"
    const wakeTime = sleep?.wake_time || "--:--"
    const durationH = sleep?.duration_hours || 0
    const hours = Math.floor(durationH)
    const minutes = Math.round((durationH - hours) * 60)
    const quality = sleep?.quality_score || 0
    const weeklyData = WEEKDAY_SHORTS.map((day, i) => {
      // Find checkin for that day of week from recent
      const checkin = recentCheckins.find((c) => {
        const d = new Date(c.date)
        return d.getDay() === i
      })
      return { day, hours: checkin?.sleep?.duration_hours || 0 }
    })
    // Rotate so Monday is first
    const rotated = [...weeklyData.slice(1), weeklyData[0]]
    return {
      score: quality * 20, // 1-5 → 20-100
      bedTime,
      wakeTime,
      duration: durationH > 0 ? `${hours}h ${minutes}min` : "--",
      deepSleepPercent: sleep?.deep_sleep_pct || 0,
      weeklyData: rotated,
    }
  })()

  // Build mood/supplements panel data
  const moodPanelData = {
    level: (latestMoodLevel || 3) as 1 | 2 | 3 | 4 | 5,
    description: todayCheckin?.mood?.description || "--",
    weeklyHistory: recentCheckins.slice(-7).map((c) => (c.mood?.level || 3) as 1 | 2 | 3 | 4 | 5),
  }
  // Pad weeklyHistory to 7
  while (moodPanelData.weeklyHistory.length < 7) {
    moodPanelData.weeklyHistory.unshift(3 as 1 | 2 | 3 | 4 | 5)
  }

  const supplementsPanelData = (todayCheckin?.supplements?.items || []).map((s: any, i: number) => ({
    id: i.toString(),
    name: s.name || "",
    dosage: s.dosage || "",
    time: s.time || "",
    taken: s.taken ?? false,
  }))

  // Nutrition current from today's checkin
  const nutritionCurrent = {
    calories: todayCheckin?.nutrition?.total_calories || 0,
    protein: todayCheckin?.nutrition?.total_protein || 0,
    carbs: todayCheckin?.nutrition?.total_carbs || 0,
    fat: todayCheckin?.nutrition?.total_fat || 0,
  }

  // Transform week data to TrainingPlanCard format
  const todayDow = new Date().getDay() || 7 // 1=Mon..7=Sun
  const weeklyTraining = weekData
    ? Array.from({ length: 7 }, (_, i) => {
        const dow = i + 1
        const day = weekData.days.find((d) => d.day_of_week === dow)
        const isRest = !day || day.day_type === "rest" || day.day_type === "active-recovery"
        let status: "completed" | "today" | "upcoming" | "rest"
        if (isRest) status = "rest"
        else if (dow === todayDow) status = "today"
        else if (dow < todayDow) status = "completed"
        else status = "upcoming"

        return {
          day: DAY_NAMES[dow],
          dayShort: DAY_SHORTS[dow],
          type: day?.label || (isRest ? (day?.day_type === "active-recovery" ? "主动恢复" : "休息日") : "训练日"),
          muscles: day?.target_muscles || [],
          volume: "",
          status,
        }
      })
    : []

  // Transform today's workout to TodayWorkout format
  const todayExercises = todayData?.plan_day?.exercises.map((ex) => ({
    id: ex.id,
    name: ex.exercise_name,
    nameEn: ex.exercise_name_en || "",
    sets: ex.sets,
    reps: ex.reps_range,
    weight: ex.target_weight || "-",
    rpe: ex.target_rpe?.toString() || "-",
  })) || []

  const todayDayLabel = todayData?.plan_day?.label || "休息日"
  const todayDuration = todayData?.plan_day?.estimated_duration
    ? `${todayData.plan_day.estimated_duration} 分钟`
    : `${plan?.minutes_per_session || 60} 分钟`

  const badgeText = plan
    ? `${goalLabels[plan.goal] || plan.goal} · ${splitLabels[plan.split_type] || plan.split_type} · W${plan.current_week}/${plan.total_weeks}`
    : "暂无训练计划"

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-[240px]">
        <TopBar
          title="Dashboard"
          badge={badgeText}
          actions={<DashboardActions />}
        />

        <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            <StatCard
              icon={Dumbbell}
              label="周训练容量"
              value={weeklyVolume > 0 ? Math.round(weeklyVolume).toLocaleString() : "--"}
              unit="kg"
              trend={{ value: 0 }}
              progress={{ current: weeklyVolume, target: 60000 }}
              status={weeklyVolume > 0 ? "success" : "neutral"}
              onClick={() => router.push("/trends")}
            />
            <StatCard
              icon={Moon}
              label="平均睡眠"
              value={avgSleep > 0 ? avgSleep.toFixed(1) : "--"}
              unit="小时"
              trend={{ value: 0 }}
              progress={{ current: avgSleep, target: 8 }}
              status={avgSleep >= 7 ? "success" : avgSleep > 0 ? "warning" : "neutral"}
              onClick={() => router.push("/trends")}
            />
            <StatCard
              icon={Beef}
              label="日均蛋白"
              value={avgProtein > 0 ? avgProtein.toString() : "--"}
              unit="g"
              trend={{ value: 0 }}
              progress={{ current: avgProtein, target: plan?.target_protein || 160 }}
              status={avgProtein > 0 ? "success" : "neutral"}
              onClick={() => router.push("/trends")}
            />
            <StatCard
              icon={Scale}
              label="体重"
              value={latestWeight ? latestWeight.toFixed(1) : "--"}
              unit="kg"
              trend={{ value: 0 }}
              progress={{ current: latestWeight || 0, target: 80 }}
              status={latestWeight ? "neutral" : "neutral"}
              onClick={() => router.push("/trends")}
            />
            <StatCard
              icon={Heart}
              label="情绪综合"
              value={latestMoodLevel ? ["", "很差", "较差", "一般", "良好", "很好"][latestMoodLevel] : "--"}
              trend={{ value: 0 }}
              progress={{ current: latestMoodLevel || 0, target: 5 }}
              status={latestMoodLevel && latestMoodLevel >= 4 ? "success" : latestMoodLevel ? "warning" : "neutral"}
              onClick={() => router.push("/trends")}
            />
          </div>

          {/* No plan prompt */}
          {!loading && !plan && (
            <AlertBanner
              title="尚未创建训练计划"
              description="前往训练计划页面，填写你的信息并生成专属训练方案。"
              severity="info"
              onViewDetails={() => router.push("/plan")}
            />
          )}

          {/* Training Plan & Today Workout */}
          {plan && weeklyTraining.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
              <TrainingPlanCard
                weekDays={weeklyTraining}
                weekLabel={plan ? `第 ${plan.current_week} 周 / 共 ${plan.total_weeks} 周` : undefined}
              />
              {todayData && !todayData.is_rest_day && todayExercises.length > 0 ? (
                <TodayWorkout
                  title={`今日训练 · ${todayDayLabel}`}
                  duration={todayDuration}
                  exercises={todayExercises}
                  summary={{
                    totalSets: todayExercises.reduce((sum, e) => sum + e.sets, 0),
                    totalVolume: "--",
                    targetMuscles: todayData.plan_day?.target_muscles || [],
                  }}
                />
              ) : (
                <div className="bg-surface-1 rounded-xl border border-border-default flex items-center justify-center p-8">
                  <div className="text-center">
                    <Moon className="w-10 h-10 text-text-muted mx-auto mb-3" />
                    <p className="text-sm font-medium text-text-primary">今日为休息日</p>
                    <p className="text-xs text-text-muted mt-1">充分恢复，为下次训练做准备</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Secondary Panels */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <NutritionPanel
              calories={{ current: nutritionCurrent.calories, target: plan?.target_calories || 2800 }}
              protein={{ current: nutritionCurrent.protein, target: plan?.target_protein || 160 }}
              carbs={{ current: nutritionCurrent.carbs, target: plan?.target_carbs || 350 }}
              fat={{ current: nutritionCurrent.fat, target: plan?.target_fat || 80 }}
              phase={goalLabels[plan?.goal || ""] || "增肌"}
            />
            <SleepPanel {...sleepPanelData} />
            <MoodSupplementsPanel mood={moodPanelData} supplements={supplementsPanelData} />
          </div>

          {/* Disclaimer */}
          <Disclaimer />
        </div>

        <FAB />
        <BottomNav />
      </main>
    </div>
  )
}
