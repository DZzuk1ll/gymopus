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

// Mock data
const weeklyTraining = [
  { day: "周一", dayShort: "一", type: "推力日 - 胸肩三头", muscles: ["胸大肌", "三角肌前束", "肱三头肌"], volume: "18,240kg", status: "completed" as const },
  { day: "周二", dayShort: "二", type: "拉力日 - 背二头", muscles: ["背阔肌", "斜方肌", "肱二头肌"], volume: "15,680kg", status: "completed" as const },
  { day: "周三", dayShort: "三", type: "腿部日 - 股四臀部", muscles: ["股四头肌", "臀大肌", "腘绳肌"], volume: "22,400kg", status: "today" as const },
  { day: "周四", dayShort: "四", type: "主动恢复", muscles: [], volume: "", status: "rest" as const },
  { day: "周五", dayShort: "五", type: "推力日 - 肩胸", muscles: ["三角肌", "胸大肌"], volume: "", status: "upcoming" as const },
  { day: "周六", dayShort: "六", type: "拉力日 - 背", muscles: ["背阔肌", "菱形肌"], volume: "", status: "upcoming" as const },
  { day: "周日", dayShort: "日", type: "休息日", muscles: [], volume: "", status: "rest" as const },
]

const todayExercises = [
  { id: "1", name: "杠铃深蹲", nameEn: "Barbell Back Squat", sets: 4, reps: "6-8", weight: "100kg", rpe: "8" },
  { id: "2", name: "罗马尼亚硬拉", nameEn: "Romanian Deadlift", sets: 3, reps: "8-10", weight: "80kg", rpe: "7" },
  { id: "3", name: "腿举", nameEn: "Leg Press", sets: 3, reps: "10-12", weight: "180kg", rpe: "8" },
  { id: "4", name: "腿弯举", nameEn: "Lying Leg Curl", sets: 3, reps: "10-12", weight: "40kg", rpe: "7" },
  { id: "5", name: "臀桥", nameEn: "Hip Thrust", sets: 3, reps: "12-15", weight: "60kg", rpe: "7" },
  { id: "6", name: "站姿提踵", nameEn: "Standing Calf Raise", sets: 4, reps: "15-20", weight: "50kg", rpe: "8" },
]

const sleepData = {
  score: 78,
  bedTime: "23:15",
  wakeTime: "06:45",
  duration: "7h 30min",
  deepSleepPercent: 22,
  weeklyData: [
    { day: "一", hours: 7.5 },
    { day: "二", hours: 6.5 },
    { day: "三", hours: 8 },
    { day: "四", hours: 5.5 },
    { day: "五", hours: 7 },
    { day: "六", hours: 8.5 },
    { day: "日", hours: 7.5 },
  ],
}

const moodData = {
  level: 4 as const,
  description: "精力充沛，状态不错",
  weeklyHistory: [3, 4, 4, 2, 3, 5, 4] as (1 | 2 | 3 | 4 | 5)[],
}

const supplements = [
  { id: "1", name: "肌酸", dosage: "5g", time: "训练前", taken: true },
  { id: "2", name: "乳清蛋白", dosage: "30g", time: "训练后", taken: false },
  { id: "3", name: "维生素D3", dosage: "2000IU", time: "早餐后", taken: true },
  { id: "4", name: "鱼油", dosage: "2粒", time: "晚餐后", taken: false },
]

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-[240px]">
        <TopBar
          title="Dashboard"
          badge="力量增长期 · Mesocycle 2 · W3/4"
          actions={<DashboardActions />}
        />

        <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
            <StatCard
              icon={Dumbbell}
              label="周训练容量"
              value="56,320"
              unit="kg"
              trend={{ value: 8, isPositive: true }}
              progress={{ current: 56320, target: 60000 }}
              status="success"
              onClick={() => router.push("/trends")}
            />
            <StatCard
              icon={Moon}
              label="平均睡眠"
              value="7.2"
              unit="小时"
              trend={{ value: -3, isPositive: false }}
              progress={{ current: 7.2, target: 8 }}
              status="warning"
              onClick={() => router.push("/trends")}
            />
            <StatCard
              icon={Beef}
              label="日均蛋白"
              value="168"
              unit="g"
              trend={{ value: 5, isPositive: true }}
              progress={{ current: 168, target: 160 }}
              status="success"
              onClick={() => router.push("/trends")}
            />
            <StatCard
              icon={Scale}
              label="体重"
              value="78.5"
              unit="kg"
              trend={{ value: 0.5, isPositive: true }}
              progress={{ current: 78.5, target: 80 }}
              status="neutral"
              onClick={() => router.push("/trends")}
            />
            <StatCard
              icon={Heart}
              label="情绪综合"
              value="良好"
              trend={{ value: 0 }}
              progress={{ current: 4, target: 5 }}
              status="success"
              onClick={() => router.push("/trends")}
            />
          </div>

          {/* Alert Banner */}
          <AlertBanner
            title="训练负荷累积风险"
            description="检测到连续 2 周训练容量上升 15%，结合睡眠时长下降趋势，建议本周四安排 Deload 或主动恢复日。"
            source="NSCA Essentials, Ch.22 — 渐进超负荷原则"
            severity="warning"
            onViewDetails={() => router.push("/suggestions")}
          />

          {/* Training Plan & Today Workout */}
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
            <TrainingPlanCard weekDays={weeklyTraining} />
            <TodayWorkout
              title="今日训练 · 腿部日"
              duration="75 分钟"
              exercises={todayExercises}
              summary={{
                totalSets: 20,
                totalVolume: "22,400kg",
                targetMuscles: ["股四头肌", "臀大肌", "腘绳肌", "小腿"],
              }}
            />
          </div>

          {/* Secondary Panels */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <NutritionPanel
              calories={{ current: 2450, target: 2800 }}
              protein={{ current: 168, target: 160 }}
              carbs={{ current: 280, target: 350 }}
              fat={{ current: 72, target: 80 }}
              phase="增肌"
            />
            <SleepPanel {...sleepData} />
            <MoodSupplementsPanel mood={moodData} supplements={supplements} />
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
