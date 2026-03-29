"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar } from "@/components/gym/top-bar"
import { cn } from "@/lib/utils"
import { apiFetch, getStoredUserId } from "@/lib/api"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

const PLAN_STORAGE_KEY = "gymops_plan_form"

function loadSavedState() {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PLAN_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function clearSavedState() {
  sessionStorage.removeItem(PLAN_STORAGE_KEY)
}
import {
  Target,
  Calendar,
  Trash2,
  Edit2,
  Plus,
  Save,
  Timer,
  Dumbbell,
  User,
  Scale,
  AlertTriangle,
  Utensils,
  Leaf,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const steps = [
  { id: 1, title: "基础信息", icon: Target },
  { id: 2, title: "身体数据", icon: User },
  { id: 3, title: "饮食偏好", icon: Utensils },
  { id: 4, title: "生成计划", icon: Sparkles },
]

const trainingGoals = [
  { id: "muscle", label: "增肌", description: "增加肌肉量和力量" },
  { id: "fat-loss", label: "减脂", description: "降低体脂率，保持肌肉" },
  { id: "strength", label: "力量提升", description: "提高最大力量" },
  { id: "maintain", label: "维持体能", description: "保持当前状态" },
]

const experienceLevels = [
  { id: "1-2", label: "1-2 年" },
  { id: "2-3", label: "2-3 年" },
  { id: "3-5", label: "3-5 年" },
  { id: "5+", label: "5 年以上" },
]

const splitTypes = [
  { id: "ppl", label: "推拉腿 (PPL)" },
  { id: "upper-lower", label: "上下肢分化" },
  { id: "full-body", label: "全身训练" },
  { id: "bro-split", label: "单肌群分化" },
]

const equipmentOptions = [
  { id: "commercial", label: "商业健身房", description: "完整器械" },
  { id: "home", label: "家庭健身房", description: "基础器械" },
  { id: "custom", label: "自定义", description: "用自然语言描述" },
]

const dietRestrictions = [
  { id: "none", label: "无限制" },
  { id: "vegetarian", label: "素食" },
  { id: "vegan", label: "纯素" },
  { id: "lactose", label: "乳糖不耐" },
  { id: "gluten", label: "麸质过敏" },
  { id: "nut", label: "坚果过敏" },
]

const parqQuestions = [
  "医生是否曾告知您有心脏方面的问题？",
  "您在进行身体活动时是否感到胸痛？",
  "在过去一个月内，您是否在非活动状态下出现过胸痛？",
  "您是否因为头晕而失去平衡或失去意识？",
  "您是否有骨骼或关节问题可能因运动而恶化？",
  "您是否正在服用任何心脏或血压相关的处方药？",
  "您是否知道有任何其他原因不应进行身体活动？",
]

const defaultFormData = {
  goal: "",
  experience: "",
  splitType: "",
  daysPerWeek: 4,
  minutesPerSession: 60,
  equipment: "",
  customDescription: "",
  height: "",
  weight: "",
  age: "",
  gender: "",
  bodyFat: "",
  injuries: "",
  parqAnswers: Array(7).fill(false),
  dietGoal: "",
  restrictions: [] as string[],
  mealsPerDay: 4,
}

export default function PlanPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [planGenerated, setPlanGenerated] = useState(false)
  const [generatedPlanId, setGeneratedPlanId] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState("")
  const [generatedNutrition, setGeneratedNutrition] = useState<any>(null)
  const [planDetail, setPlanDetail] = useState<any>(null)
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)

  // 1) Restore draft from sessionStorage, then pre-fill from user profile
  useEffect(() => {
    async function init() {
      const saved = loadSavedState()

      // Always pre-fill body data from user profile first
      const userId = getStoredUserId()
      let userDefaults: Record<string, any> = {}
      if (userId) {
        try {
          const user = await apiFetch(`/api/v1/users/${userId}`)
          userDefaults = {
            height: user.height_cm?.toString() || "",
            weight: user.weight_kg?.toString() || "",
            age: user.age?.toString() || "",
            gender: user.gender === "male" ? "男" : user.gender === "female" ? "女" : "",
            bodyFat: user.body_fat_pct?.toString() || "",
            injuries: user.injuries || "",
            experience: user.experience || "",
            goal: user.training_goal || "",
          }
        } catch {}
      }

      if (saved?.currentStep) {
        // Has draft → restore it, but merge user defaults for empty body fields
        setCurrentStep(saved.currentStep)
        if (saved.planGenerated) setPlanGenerated(true)
        if (saved.generatedPlanId) setGeneratedPlanId(saved.generatedPlanId)
        if (saved.generatedNutrition) setGeneratedNutrition(saved.generatedNutrition)
        if (saved.planDetail) setPlanDetail(saved.planDetail)
        if (saved.formData) {
          const merged = { ...saved.formData }
          // Fill empty body fields from user profile
          for (const key of Object.keys(userDefaults)) {
            if (!merged[key]) merged[key] = userDefaults[key]
          }
          setFormData(merged)
        }
      } else {
        // No draft → start fresh with user profile defaults
        setFormData((prev: any) => ({ ...prev, ...userDefaults }))
      }
      setReady(true)
    }
    init()
  }, [])

  // 2) Persist to sessionStorage — only after init is done
  useEffect(() => {
    if (!ready) return
    const state = { currentStep, planGenerated, generatedPlanId, generatedNutrition, planDetail, formData }
    sessionStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(state))
  }, [ready, currentStep, planGenerated, generatedPlanId, generatedNutrition, planDetail, formData])

  const updateForm = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const toggleRestriction = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      restrictions: prev.restrictions.includes(id)
        ? prev.restrictions.filter((r) => r !== id)
        : [...prev.restrictions, id],
    }))
  }

  const toggleParq = (index: number) => {
    const newAnswers = [...formData.parqAnswers]
    newAnswers[index] = !newAnswers[index]
    updateForm("parqAnswers", newAnswers)
  }

  const hasParqRisk = formData.parqAnswers.some((a) => a)

  const nextStep = () => {
    if (currentStep === 3) {
      generatePlan()
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const generatePlan = async () => {
    setCurrentStep(4)
    setIsGenerating(true)
    setGenerateError("")
    try {
      const userId = getStoredUserId()
      if (!userId) {
        setGenerateError("请先在设置页创建用户")
        setIsGenerating(false)
        return
      }
      const result = await apiFetch("/api/v1/plans/generate", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          goal: formData.goal,
          experience: formData.experience,
          split_type: formData.splitType,
          days_per_week: formData.daysPerWeek,
          minutes_per_session: formData.minutesPerSession,
          equipment: formData.equipment,
          custom_description: formData.customDescription || undefined,
          height_cm: parseFloat(formData.height) || undefined,
          weight_kg: parseFloat(formData.weight) || undefined,
          age: parseInt(formData.age) || undefined,
          gender: formData.gender || undefined,
          body_fat_pct: parseFloat(formData.bodyFat) || undefined,
          injuries: formData.injuries || undefined,
          diet_goal: formData.dietGoal || "maintain",
          restrictions: formData.restrictions.filter((r) => r !== "none"),
          meals_per_day: formData.mealsPerDay,
        }),
      })
      setGeneratedPlanId(result.plan_id)
      setGeneratedNutrition(result.nutrition_targets)
      // Fetch full plan detail for editing
      const detail = await apiFetch(`/api/v1/plans/${result.plan_id}`).catch(() => null)
      setPlanDetail(detail)
      setPlanGenerated(true)
    } catch (e: any) {
      setGenerateError(e.message || "计划生成失败，请检查 AI 配置")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-[240px]">
        <TopBar title="训练计划" showDate={false} />

        <div className="p-4 lg:p-6 pb-24 lg:pb-6">
          {/* Progress Steps */}
          <div className="mb-8 rounded-2xl border border-border-default bg-surface-1 p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {steps.map((step) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                const statusLabel = isCompleted ? "已完成" : isActive ? "当前步骤" : "待填写"

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "min-h-[112px] rounded-xl border px-4 py-4 transition-all",
                      isActive
                        ? "border-accent bg-accent/10 shadow-sm"
                        : isCompleted
                        ? "border-success/50 bg-success/10"
                        : "border-border-default bg-surface-2"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                          isActive
                            ? "bg-accent border-accent text-accent-foreground"
                            : isCompleted
                            ? "bg-success border-success text-success-foreground"
                            : "bg-surface-2 border-border-default text-text-muted"
                        )}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
                          isActive
                            ? "bg-accent/15 text-accent"
                            : isCompleted
                            ? "bg-success/15 text-success"
                            : "bg-surface-3 text-text-muted"
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-text-muted">
                        Step {String(step.id).padStart(2, "0")}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-medium leading-6",
                          isActive ? "text-accent" : isCompleted ? "text-success" : "text-text-primary"
                        )}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-text-primary mb-1">基础信息收集</h2>
                  <p className="text-sm text-text-muted">告诉我们你的训练目标和偏好</p>
                </div>

                {/* Training Goal */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-3 block">训练目标</label>
                  <div className="grid grid-cols-2 gap-3">
                    {trainingGoals.map((goal) => (
                      <button
                        key={goal.id}
                        onClick={() => updateForm("goal", goal.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          formData.goal === goal.id
                            ? "bg-accent/10 border-accent"
                            : "bg-surface-2 border-transparent hover:bg-surface-3"
                        )}
                      >
                        <p className={cn("font-medium", formData.goal === goal.id ? "text-accent" : "text-text-primary")}>
                          {goal.label}
                        </p>
                        <p className="text-xs text-text-muted mt-1">{goal.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience & Split */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-3 block">训练经验</label>
                    <div className="flex flex-wrap gap-2">
                      {experienceLevels.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => updateForm("experience", level.id)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            formData.experience === level.id
                              ? "bg-accent text-accent-foreground"
                              : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary mb-3 block">分化方式</label>
                    <div className="flex flex-wrap gap-2">
                      {splitTypes.map((split) => (
                        <button
                          key={split.id}
                          onClick={() => updateForm("splitType", split.id)}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            formData.splitType === split.id
                              ? "bg-accent text-accent-foreground"
                              : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                          )}
                        >
                          {split.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Days & Duration */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-text-primary mb-3 block">
                      每周训练天数: <span className="text-accent">{formData.daysPerWeek} 天</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="6"
                      value={formData.daysPerWeek}
                      onChange={(e) => updateForm("daysPerWeek", parseInt(e.target.value))}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>2 天</span>
                      <span>6 天</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-primary mb-3 block">
                      每次训练时长: <span className="text-accent">{formData.minutesPerSession} 分钟</span>
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="120"
                      step="15"
                      value={formData.minutesPerSession}
                      onChange={(e) => updateForm("minutesPerSession", parseInt(e.target.value))}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>30 分钟</span>
                      <span>120 分钟</span>
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-3 block">可用器械/场所</label>
                  <div className="grid grid-cols-3 gap-3">
                    {equipmentOptions.map((eq) => (
                      <button
                        key={eq.id}
                        onClick={() => updateForm("equipment", eq.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all",
                          formData.equipment === eq.id
                            ? "bg-accent/10 border-accent"
                            : "bg-surface-2 border-transparent hover:bg-surface-3"
                        )}
                      >
                        <Dumbbell className={cn("w-6 h-6 mx-auto mb-2", formData.equipment === eq.id ? "text-accent" : "text-text-muted")} />
                        <p className={cn("text-sm font-medium", formData.equipment === eq.id ? "text-accent" : "text-text-primary")}>
                          {eq.label}
                        </p>
                        <p className="text-xs text-text-muted mt-1">{eq.description}</p>
                      </button>
                    ))}
                  </div>

                  {/* Custom description textarea */}
                  {formData.equipment === "custom" && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-text-primary mb-2 block">描述你的训练偏好</label>
                      <textarea
                        value={formData.customDescription}
                        onChange={(e) => updateForm("customDescription", e.target.value)}
                        placeholder={"例如：\n• 我有哑铃（5-30kg）、引体向上架、弹力带\n• 我想练推拉腿，重点发展胸和背\n• 每个动作 4 组，周三周六休息\n• 不要硬拉，腰有旧伤"}
                        rows={5}
                        className="w-full px-3 py-2 text-sm bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted resize-none"
                      />
                      <p className="text-xs text-text-muted mt-2">用自然语言描述你的器械、偏好动作、训练安排等，AI 会据此生成计划</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Body Data */}
            {currentStep === 2 && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-text-primary mb-1">身体数据</h2>
                  <p className="text-sm text-text-muted">用于计算营养目标和训练负荷</p>
                </div>

                {/* Basic Measurements */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">身高</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => updateForm("height", e.target.value)}
                        placeholder="175"
                        className="flex-1 px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary"
                      />
                      <span className="text-xs text-text-muted">cm</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">体重</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => updateForm("weight", e.target.value)}
                        placeholder="78"
                        className="flex-1 px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary"
                      />
                      <span className="text-xs text-text-muted">kg</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">年龄</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateForm("age", e.target.value)}
                      placeholder="28"
                      className="w-full px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">性别</label>
                    <div className="flex gap-2">
                      {["男", "女"].map((g) => (
                        <button
                          key={g}
                          onClick={() => updateForm("gender", g)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                            formData.gender === g
                              ? "bg-accent text-accent-foreground"
                              : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional: Body Fat */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">体脂率 (可选)</label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      value={formData.bodyFat}
                      onChange={(e) => updateForm("bodyFat", e.target.value)}
                      placeholder="15"
                      className="flex-1 px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary"
                    />
                    <span className="text-xs text-text-muted">%</span>
                  </div>
                </div>

                {/* Injuries */}
                <div>
                  <label className="text-xs text-text-muted mb-2 block">已知伤病或禁忌动作</label>
                  <textarea
                    value={formData.injuries}
                    onChange={(e) => updateForm("injuries", e.target.value)}
                    placeholder="例如：左膝十字韧带术后恢复中，避免深蹲..."
                    className="w-full px-3 py-2 text-sm bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted resize-none h-20"
                  />
                </div>

                {/* PAR-Q */}
                <div className="p-4 bg-warning-muted rounded-xl border border-warning/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <h3 className="text-sm font-medium text-text-primary">健康风险筛查 (PAR-Q)</h3>
                  </div>
                  <p className="text-xs text-text-muted mb-4">请如实回答以下问题，如有任何"是"的回答，建议在开始训练前咨询医生。</p>
                  <div className="space-y-3">
                    {parqQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => toggleParq(i)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                          formData.parqAnswers[i] ? "bg-danger/10" : "bg-surface-2 hover:bg-surface-3"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-5 h-5 rounded border-2 transition-colors flex-shrink-0",
                            formData.parqAnswers[i] ? "bg-danger border-danger" : "border-border-hover"
                          )}
                        >
                          {formData.parqAnswers[i] && <Check className="w-3 h-3 text-danger-foreground" />}
                        </div>
                        <span className="text-sm text-text-secondary">{q}</span>
                      </button>
                    ))}
                  </div>
                  {hasParqRisk && (
                    <div className="mt-4 p-3 bg-danger/10 rounded-lg border border-danger/30">
                      <p className="text-sm text-danger font-medium">
                        建议在开始训练计划前咨询医生或专业医疗人员
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Diet */}
            {currentStep === 3 && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-text-primary mb-1">饮食偏好</h2>
                  <p className="text-sm text-text-muted">设置你的营养目标和限制</p>
                </div>

                {/* Diet Goal */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-3 block">饮食目标</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "surplus", label: "热量盈余", description: "增肌增重" },
                      { id: "deficit", label: "热量赤字", description: "减脂减重" },
                      { id: "maintain", label: "热量平衡", description: "维持体重" },
                    ].map((diet) => (
                      <button
                        key={diet.id}
                        onClick={() => updateForm("dietGoal", diet.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all",
                          formData.dietGoal === diet.id
                            ? "bg-accent/10 border-accent"
                            : "bg-surface-2 border-transparent hover:bg-surface-3"
                        )}
                      >
                        <p className={cn("text-sm font-medium", formData.dietGoal === diet.id ? "text-accent" : "text-text-primary")}>
                          {diet.label}
                        </p>
                        <p className="text-xs text-text-muted mt-1">{diet.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Restrictions */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-3 block">饮食限制</label>
                  <div className="flex flex-wrap gap-2">
                    {dietRestrictions.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => toggleRestriction(r.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                          formData.restrictions.includes(r.id)
                            ? "bg-accent text-accent-foreground"
                            : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meals per day */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-3 block">
                    每日餐数: <span className="text-accent">{formData.mealsPerDay} 餐</span>
                  </label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => updateForm("mealsPerDay", n)}
                        className={cn(
                          "flex-1 py-3 rounded-lg text-sm font-medium transition-all",
                          formData.mealsPerDay === n
                            ? "bg-accent text-accent-foreground"
                            : "bg-surface-2 text-text-secondary hover:bg-surface-3"
                        )}
                      >
                        {n} 餐
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Generate */}
            {currentStep === 4 && (
              <div className="p-6">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <h2 className="text-lg font-medium text-text-primary mb-2">正在生成你的专属计划</h2>
                    <p className="text-sm text-text-muted text-center mb-6">
                      基于 NSCA 训练原则为你编排方案，通常需要 30-60 秒...
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => { setIsGenerating(false); setCurrentStep(3); setGenerateError("已取消生成") }}
                      className="gap-2 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      取消并返回
                    </Button>
                  </div>
                ) : (planGenerated || generatedPlanId) ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-success/10 rounded-xl border border-success/30">
                      <Check className="w-6 h-6 text-success" />
                      <div>
                        <h2 className="text-lg font-medium text-text-primary">计划生成完成</h2>
                        <p className="text-sm text-text-muted">已根据你的数据定制训练和营养方案</p>
                      </div>
                    </div>

                    {/* Training Plan Summary */}
                    <div className="p-4 bg-surface-2 rounded-xl">
                      <h3 className="text-sm font-medium text-text-primary mb-3">训练计划总览</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-surface-1 rounded-lg">
                          <p className="text-xs text-text-muted">周期结构</p>
                          <p className="text-sm font-medium text-text-primary">{planDetail?.total_weeks || 4} 周 Mesocycle</p>
                        </div>
                        <div className="p-3 bg-surface-1 rounded-lg">
                          <p className="text-xs text-text-muted">分化方式</p>
                          <p className="text-sm font-medium text-text-primary">{splitTypes.find(s => s.id === formData.splitType)?.label || formData.splitType}</p>
                        </div>
                        <div className="p-3 bg-surface-1 rounded-lg">
                          <p className="text-xs text-text-muted">周频次</p>
                          <p className="text-sm font-medium text-text-primary">{formData.daysPerWeek} 天/周</p>
                        </div>
                        <div className="p-3 bg-surface-1 rounded-lg">
                          <p className="text-xs text-text-muted">单次时长</p>
                          <p className="text-sm font-medium text-text-primary">{formData.minutesPerSession} 分钟</p>
                        </div>
                      </div>
                    </div>

                    {/* Nutrition Summary */}
                    <div className="p-4 bg-surface-2 rounded-xl">
                      <h3 className="text-sm font-medium text-text-primary mb-3">营养目标</h3>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="p-3 bg-surface-1 rounded-lg text-center">
                          <p className="text-xs text-text-muted">热量</p>
                          <p className="text-lg font-semibold font-mono text-warning">{generatedNutrition?.calories?.toLocaleString() || "2,800"}</p>
                          <p className="text-[10px] text-text-muted">kcal</p>
                        </div>
                        <div className="p-3 bg-surface-1 rounded-lg text-center">
                          <p className="text-xs text-text-muted">蛋白质</p>
                          <p className="text-lg font-semibold font-mono text-accent">{generatedNutrition?.protein_g || "160"}</p>
                          <p className="text-[10px] text-text-muted">g</p>
                        </div>
                        <div className="p-3 bg-surface-1 rounded-lg text-center">
                          <p className="text-xs text-text-muted">碳水</p>
                          <p className="text-lg font-semibold font-mono text-success">{generatedNutrition?.carbs_g || "350"}</p>
                          <p className="text-[10px] text-text-muted">g</p>
                        </div>
                        <div className="p-3 bg-surface-1 rounded-lg text-center">
                          <p className="text-xs text-text-muted">脂肪</p>
                          <p className="text-lg font-semibold font-mono text-info">{generatedNutrition?.fat_g || "80"}</p>
                          <p className="text-[10px] text-text-muted">g</p>
                        </div>
                      </div>
                    </div>

                    {/* Editable Plan Detail */}
                    {planDetail?.weeks?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-text-primary">训练安排 (可编辑)</h3>
                        {planDetail.weeks[0]?.days?.map((day: any) => (
                          <div key={day.id} className="bg-surface-2 rounded-xl overflow-hidden">
                            <div className="px-4 py-2 bg-surface-3 flex items-center justify-between">
                              <span className="text-sm font-medium text-text-primary">{day.label || day.day_type}</span>
                              <span className="text-xs text-text-muted">
                                {(day.target_muscles || []).join(" · ")}
                              </span>
                            </div>
                            <div className="divide-y divide-border-default">
                              {(day.exercises || []).map((ex: any) => (
                                <div key={ex.id} className="px-4 py-2 flex items-center gap-3">
                                  {editingExercise === ex.id ? (
                                    <div className="flex-1 flex flex-wrap items-center gap-2">
                                      <input
                                        defaultValue={ex.exercise_name}
                                        onBlur={async (e) => {
                                          const name = e.target.value.trim()
                                          if (name && name !== ex.exercise_name) {
                                            await apiFetch(`/api/v1/plans/exercises/${ex.id}`, {
                                              method: "PUT",
                                              body: JSON.stringify({ exercise_name: name }),
                                            })
                                            ex.exercise_name = name
                                          }
                                          setEditingExercise(null)
                                        }}
                                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                                        autoFocus
                                        className="flex-1 min-w-0 px-2 py-1 text-sm bg-surface-1 border border-accent rounded focus:outline-none text-text-primary"
                                      />
                                      <input
                                        defaultValue={ex.sets}
                                        type="number"
                                        onBlur={async (e) => {
                                          const sets = parseInt(e.target.value)
                                          if (sets > 0 && sets !== ex.sets) {
                                            await apiFetch(`/api/v1/plans/exercises/${ex.id}`, {
                                              method: "PUT",
                                              body: JSON.stringify({ sets }),
                                            })
                                            ex.sets = sets
                                          }
                                        }}
                                        className="w-12 px-2 py-1 text-sm font-mono bg-surface-1 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary text-center"
                                      />
                                      <span className="text-xs text-text-muted">组 ×</span>
                                      <input
                                        defaultValue={ex.reps_range}
                                        onBlur={async (e) => {
                                          const reps = e.target.value.trim()
                                          if (reps && reps !== ex.reps_range) {
                                            await apiFetch(`/api/v1/plans/exercises/${ex.id}`, {
                                              method: "PUT",
                                              body: JSON.stringify({ reps_range: reps }),
                                            })
                                            ex.reps_range = reps
                                          }
                                        }}
                                        className="w-16 px-2 py-1 text-sm font-mono bg-surface-1 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary text-center"
                                      />
                                      <span className="text-xs text-text-muted">次</span>
                                    </div>
                                  ) : (
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm text-text-primary">{ex.exercise_name}</span>
                                      <span className="text-xs text-text-muted ml-2">{ex.sets}×{ex.reps_range}</span>
                                    </div>
                                  )}
                                  <button onClick={() => setEditingExercise(editingExercise === ex.id ? null : ex.id)} className="p-1 hover:bg-surface-3 rounded transition-colors">
                                    <Edit2 className="w-3.5 h-3.5 text-text-muted" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await apiFetch(`/api/v1/plans/exercises/${ex.id}`, { method: "DELETE" })
                                      setPlanDetail((prev: any) => ({
                                        ...prev,
                                        weeks: prev.weeks.map((w: any) => ({
                                          ...w,
                                          days: w.days.map((d: any) => ({
                                            ...d,
                                            exercises: d.exercises.filter((e: any) => e.id !== ex.id),
                                          })),
                                        })),
                                      }))
                                    }}
                                    className="p-1 hover:bg-danger/10 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-text-muted hover:text-danger" />
                                  </button>
                                </div>
                              ))}
                              {/* Add exercise */}
                              <button
                                onClick={async () => {
                                  const created = await apiFetch("/api/v1/plans/exercises", {
                                    method: "POST",
                                    body: JSON.stringify({ day_id: day.id, exercise_name: "新动作", sets: 3, reps_range: "8-12" }),
                                  })
                                  setPlanDetail((prev: any) => ({
                                    ...prev,
                                    weeks: prev.weeks.map((w: any) => ({
                                      ...w,
                                      days: w.days.map((d: any) =>
                                        d.id === day.id ? { ...d, exercises: [...d.exercises, created] } : d
                                      ),
                                    })),
                                  }))
                                  setEditingExercise(created.id)
                                }}
                                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-text-muted hover:text-accent hover:bg-surface-3 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                添加动作
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button onClick={() => { clearSavedState(); router.push("/") }} className="w-full h-12 gap-2 bg-accent hover:bg-accent-hover text-accent-foreground text-base font-medium">
                      <Check className="w-5 h-5" />
                      确认并开始
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-8">
                    {generateError && (
                      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                        {generateError}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button onClick={() => setCurrentStep(3)} variant="outline" className="flex-1 gap-2 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary">
                        <ChevronLeft className="w-4 h-4" />
                        返回修改
                      </Button>
                      <Button onClick={generatePlan} className="flex-1 gap-2 bg-accent hover:bg-accent-hover text-accent-foreground">
                        <Sparkles className="w-4 h-4" />
                        {generateError ? "重新生成" : "开始生成"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            {currentStep < 4 && (
              <div className="flex items-center justify-between p-4 bg-surface-2 border-t border-border-default">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  variant="outline"
                  className="gap-2 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一步
                </Button>
                <Button
                  onClick={nextStep}
                  className="gap-2 bg-accent hover:bg-accent-hover text-accent-foreground"
                >
                  {currentStep === 3 ? "生成计划" : "下一步"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </main>
    </div>
  )
}
