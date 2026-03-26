"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar } from "@/components/gym/top-bar"
import { cn } from "@/lib/utils"
import { apiFetch, getStoredUserId } from "@/lib/api"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Target,
  Calendar,
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
  { id: "custom", label: "自选器械", description: "自定义设备" },
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

export default function PlanPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [planGenerated, setPlanGenerated] = useState(false)
  const [generatedPlanId, setGeneratedPlanId] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState("")
  const [generatedNutrition, setGeneratedNutrition] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1
    goal: "",
    experience: "",
    splitType: "",
    daysPerWeek: 4,
    minutesPerSession: 60,
    equipment: "",
    // Step 2
    height: "",
    weight: "",
    age: "",
    gender: "",
    bodyFat: "",
    injuries: "",
    parqAnswers: Array(7).fill(false),
    // Step 3
    dietGoal: "",
    restrictions: [] as string[],
    mealsPerDay: 4,
  })

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
          <div className="flex items-center justify-between mb-8 p-4 bg-surface-1 rounded-xl border border-border-default">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
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
                        "mt-2 text-xs font-medium",
                        isActive ? "text-accent" : isCompleted ? "text-success" : "text-text-muted"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "hidden sm:block w-full h-0.5 mx-2",
                        currentStep > step.id ? "bg-success" : "bg-border-default"
                      )}
                    />
                  )}
                </div>
              )
            })}
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
                    <p className="text-sm text-text-muted text-center">
                      基于 NSCA 训练原则为你编排方案...
                    </p>
                  </div>
                ) : planGenerated ? (
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
                          <p className="text-sm font-medium text-text-primary">4 周 Mesocycle</p>
                        </div>
                        <div className="p-3 bg-surface-1 rounded-lg">
                          <p className="text-xs text-text-muted">分化方式</p>
                          <p className="text-sm font-medium text-text-primary">推拉腿 (PPL)</p>
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
                      {generatedPlanId && (
                        <Button variant="outline" onClick={() => router.push("/")} className="w-full gap-2 bg-transparent border-border-default hover:bg-surface-3">
                          查看详细训练安排
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
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

                    {generateError && (
                      <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                        {generateError}
                      </div>
                    )}

                    <Button onClick={() => router.push("/")} className="w-full h-12 gap-2 bg-accent hover:bg-accent-hover text-accent-foreground text-base font-medium">
                      <Check className="w-5 h-5" />
                      确认并开始
                    </Button>
                  </div>
                ) : null}
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
