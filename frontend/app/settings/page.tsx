"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar } from "@/components/gym/top-bar"
import { cn } from "@/lib/utils"
import { apiFetch, getStoredUserId, setStoredUserId, clearStoredUserId } from "@/lib/api"
import { useState, useEffect, useCallback } from "react"
import {
  User,
  Scale,
  Target,
  Settings,
  Bell,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Edit2,
  Save,
  Calendar,
  Bot,
  Key,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertTriangle,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const EXPERIENCE_OPTIONS = ["1-2", "2-3", "3-5", "5+"]
const GOAL_OPTIONS = [
  { id: "muscle", label: "增肌" },
  { id: "fat-loss", label: "减脂" },
  { id: "strength", label: "力量" },
  { id: "maintain", label: "维持" },
]
const GOAL_LABELS: Record<string, string> = { muscle: "增肌", "fat-loss": "减脂", strength: "力量", maintain: "维持" }

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const [profile, setProfile] = useState({
    name: "",
    height_cm: 175,
    weight_kg: 70,
    age: 25,
    gender: "male" as "male" | "female" | "other",
    experience: "2-3",
    level: "intermediate",
    training_goal: "muscle",
    injuries: "",
    body_fat_pct: null as number | null,
    parq_has_risk: false,
  })

  const [preferences, setPreferences] = useState({
    unit: "metric",
    reminderTime: "18:00",
    alertsEnabled: true,
  })

  const [aiConfig, setAiConfig] = useState({
    provider: "openai",
    model: "gpt-4o",
    apiKey: "",
    baseUrl: "",
  })

  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [apiTesting, setApiTesting] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<{ status: string; error?: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)

  const aiProviders = [
    { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
    { id: "anthropic", name: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"] },
    { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-coder"] },
    { id: "custom", name: "自定义", models: [] },
  ]

  const currentProvider = aiProviders.find((p) => p.id === aiConfig.provider)

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedId = getStoredUserId()
      if (storedId) {
        try {
          const user = await apiFetch(`/api/v1/users/${storedId}`)
          setUserId(storedId)
          setProfile({
            name: user.name || "",
            height_cm: user.height_cm || 175,
            weight_kg: user.weight_kg || 70,
            age: user.age || 25,
            gender: user.gender || "male",
            experience: user.experience || "2-3",
            level: user.level || "intermediate",
            training_goal: user.training_goal || "muscle",
            injuries: user.injuries || "",
            body_fat_pct: user.body_fat_pct,
            parq_has_risk: user.parq_has_risk || false,
          })
          setPreferences({
            unit: user.unit_system || "metric",
            reminderTime: user.reminder_time || "18:00",
            alertsEnabled: user.alerts_enabled ?? true,
          })
          // Load AI config
          try {
            const configs = await apiFetch<any[]>(`/api/v1/users/${storedId}/ai-config`)
            if (configs.length > 0) {
              const active = configs.find((c: any) => c.is_active) || configs[0]
              setAiConfig({
                provider: active.provider,
                model: active.model,
                apiKey: "",
                baseUrl: active.base_url || "",
              })
              setApiKeySaved(true)
            }
          } catch {}
        } catch {
          // User not found, clear stored ID
          clearStoredUserId()
          setIsNewUser(true)
          setIsEditing(true)
        }
      } else {
        setIsNewUser(true)
        setIsEditing(true)
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(""), 2000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError("")
    try {
      if (isNewUser) {
        const user = await apiFetch("/api/v1/users", {
          method: "POST",
          body: JSON.stringify({
            name: profile.name || "用户",
            gender: profile.gender,
            age: profile.age,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            body_fat_pct: profile.body_fat_pct,
            experience: profile.experience,
            training_goal: profile.training_goal,
            injuries: profile.injuries || undefined,
          }),
        })
        setStoredUserId(user.id)
        setUserId(user.id)
        setIsNewUser(false)
        setProfile((prev) => ({ ...prev, level: user.level }))
        showSuccess("用户创建成功")
      } else if (userId) {
        const user = await apiFetch(`/api/v1/users/${userId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: profile.name,
            gender: profile.gender,
            age: profile.age,
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            body_fat_pct: profile.body_fat_pct,
            experience: profile.experience,
            training_goal: profile.training_goal,
            injuries: profile.injuries || undefined,
            unit_system: preferences.unit,
            reminder_time: preferences.reminderTime,
            alerts_enabled: preferences.alertsEnabled,
          }),
        })
        setProfile((prev) => ({ ...prev, level: user.level }))
        showSuccess("保存成功")
      }
      setIsEditing(false)
    } catch (e: any) {
      setError(e.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!userId || !aiConfig.apiKey) return
    setSaving(true)
    try {
      await apiFetch(`/api/v1/users/${userId}/ai-config`, {
        method: "PUT",
        body: JSON.stringify({
          provider: aiConfig.provider,
          model: aiConfig.model,
          api_key: aiConfig.apiKey,
          base_url: aiConfig.baseUrl || undefined,
        }),
      })
      setApiKeySaved(true)
      setAiConfig((prev) => ({ ...prev, apiKey: "" }))
      showSuccess("AI 配置已保存")
    } catch (e: any) {
      setError(e.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleTestAI = async () => {
    if (!userId) return
    setApiTesting(true)
    setApiTestResult(null)
    try {
      const result = await apiFetch(`/api/v1/users/${userId}/ai-config/test`, { method: "POST" })
      setApiTestResult(result)
    } catch (e: any) {
      setApiTestResult({ status: "failed", error: e.message })
    } finally {
      setApiTesting(false)
    }
  }

  const handleExportData = async () => {
    if (!userId) return
    try {
      const [user, checkins] = await Promise.all([
        apiFetch(`/api/v1/users/${userId}`),
        apiFetch(`/api/v1/checkins/${userId}`),
      ])
      const exportData = { user, checkins, exported_at: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gymops-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess("数据已导出")
    } catch (e: any) {
      setError(e.message || "导出失败")
    }
  }

  const handleDeleteAllData = async () => {
    if (!userId) return
    try {
      await apiFetch(`/api/v1/users/${userId}`, { method: "DELETE" })
      clearStoredUserId()
      setUserId(null)
      setIsNewUser(true)
      setIsEditing(true)
      setShowDeleteConfirm(false)
      setProfile({
        name: "", height_cm: 175, weight_kg: 70, age: 25, gender: "male",
        experience: "2-3", level: "intermediate", training_goal: "muscle",
        injuries: "", body_fat_pct: null, parq_has_risk: false,
      })
      setAiConfig({ provider: "openai", model: "gpt-4o", apiKey: "", baseUrl: "" })
      setApiKeySaved(false)
      showSuccess("所有数据已清除")
    } catch (e: any) {
      setError(e.message || "清除失败")
    }
  }

  const handleLogout = () => {
    clearStoredUserId()
    setUserId(null)
    setIsNewUser(true)
    setIsEditing(true)
    showSuccess("已退出")
  }

  const updateProfile = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const genderLabel = profile.gender === "male" ? "男" : profile.gender === "female" ? "女" : "其他"
  const expLabel = profile.experience ? `${profile.experience} 年` : ""

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-[240px]">
        <TopBar title="个人设置" showDate={false} />

        <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-6">
          {/* Status messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
              <button onClick={() => setError("")} className="ml-auto text-xs">✕</button>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
              <Check className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {isNewUser && (
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent text-sm">
              <Plus className="w-4 h-4 shrink-0" />
              欢迎！请填写个人资料以开始使用 GymOps。
            </div>
          )}

          {/* Profile Section */}
          <section className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h2 className="text-sm font-medium text-text-primary">个人资料</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    handleSaveProfile()
                  } else {
                    setIsEditing(true)
                  }
                }}
                disabled={saving}
                className="gap-2 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isEditing ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    保存
                  </>
                ) : (
                  <>
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑
                  </>
                )}
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center">
                    <User className="w-8 h-8 text-text-muted" />
                  </div>
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => updateProfile("name", e.target.value)}
                      placeholder="输入你的名字"
                      className="text-lg font-medium bg-surface-2 border border-border-default rounded-lg px-3 py-1 focus:border-accent focus:outline-none text-text-primary w-full"
                    />
                  ) : (
                    <h3 className="text-lg font-medium text-text-primary">{profile.name || "未设置"}</h3>
                  )}
                  <p className="text-sm text-text-muted">{profile.level === "intermediate" ? "中级" : profile.level} · {expLabel}训练经验</p>
                </div>
              </div>

              {/* Body Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-surface-2 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">身高</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={profile.height_cm} onChange={(e) => updateProfile("height_cm", parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 text-sm font-mono bg-surface-3 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary" />
                      <span className="text-xs text-text-muted">cm</span>
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-text-primary">{profile.height_cm} cm</p>
                  )}
                </div>
                <div className="p-3 bg-surface-2 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">体重</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input type="number" step="0.1" value={profile.weight_kg} onChange={(e) => updateProfile("weight_kg", parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 text-sm font-mono bg-surface-3 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary" />
                      <span className="text-xs text-text-muted">kg</span>
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-text-primary">{profile.weight_kg} kg</p>
                  )}
                </div>
                <div className="p-3 bg-surface-2 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">年龄</p>
                  {isEditing ? (
                    <input type="number" value={profile.age} onChange={(e) => updateProfile("age", parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 text-sm font-mono bg-surface-3 border border-border-default rounded focus:border-accent focus:outline-none text-text-primary" />
                  ) : (
                    <p className="text-sm font-mono text-text-primary">{profile.age} 岁</p>
                  )}
                </div>
                <div className="p-3 bg-surface-2 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">性别</p>
                  {isEditing ? (
                    <div className="flex gap-1">
                      {([["male", "男"], ["female", "女"]] as const).map(([val, label]) => (
                        <button key={val} onClick={() => updateProfile("gender", val)} className={cn("px-2 py-1 text-xs rounded transition-colors", profile.gender === val ? "bg-accent text-accent-foreground" : "bg-surface-3 text-text-muted hover:bg-surface-4")}>
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-primary">{genderLabel}</p>
                  )}
                </div>
              </div>

              {/* Experience (only in edit mode) */}
              {isEditing && (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted">训练经验</p>
                  <div className="flex gap-2">
                    {EXPERIENCE_OPTIONS.map((exp) => (
                      <button key={exp} onClick={() => updateProfile("experience", exp)} className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", profile.experience === exp ? "bg-accent text-accent-foreground" : "bg-surface-2 text-text-muted hover:bg-surface-3")}>
                        {exp} 年
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Goals Section */}
          <section className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h2 className="text-sm font-medium text-text-primary">目标设置</h2>
              {!isNewUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editingGoal) {
                      handleSaveProfile()
                      setEditingGoal(false)
                    } else {
                      setEditingGoal(true)
                    }
                  }}
                  disabled={saving}
                  className="gap-2 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary"
                >
                  {editingGoal ? <><Save className="w-3.5 h-3.5" />保存</> : <><Edit2 className="w-3.5 h-3.5" />编辑</>}
                </Button>
              )}
            </div>

            <div className="p-4 space-y-4">
              {editingGoal ? (
                <div className="space-y-3">
                  <p className="text-xs text-text-muted">选择你的训练目标</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GOAL_OPTIONS.map((g) => (
                      <button key={g.id} onClick={() => updateProfile("training_goal", g.id)} className={cn("px-3 py-2 text-sm font-medium rounded-lg border transition-colors", profile.training_goal === g.id ? "bg-accent/10 border-accent text-accent" : "bg-surface-2 border-border-default text-text-secondary hover:border-text-muted")}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">当前训练目标</p>
                        <p className="text-xs text-text-muted">{GOAL_LABELS[profile.training_goal] || "未设置"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">当前体重</p>
                        <p className="text-xs text-text-muted">{profile.weight_kg} kg</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-warning" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">训练经验</p>
                        <p className="text-xs text-text-muted">{expLabel}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Preferences Section */}
          <section className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
            <div className="px-4 py-3 border-b border-border-default">
              <h2 className="text-sm font-medium text-text-primary">偏好设置</h2>
            </div>

            <div className="divide-y divide-border-default">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">单位偏好</p>
                  <p className="text-xs text-text-muted">选择重量和长度单位</p>
                </div>
                <div className="flex bg-surface-2 rounded-lg p-0.5">
                  {[
                    { id: "metric", label: "公制 (kg/cm)" },
                    { id: "imperial", label: "英制 (lb/in)" },
                  ].map((unit) => (
                    <button key={unit.id} onClick={() => setPreferences((prev) => ({ ...prev, unit: unit.id }))} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", preferences.unit === unit.id ? "bg-accent text-accent-foreground" : "text-text-muted hover:text-text-secondary")}>
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">打卡提醒时间</p>
                  <p className="text-xs text-text-muted">每日提醒你完成打卡</p>
                </div>
                <input type="time" value={preferences.reminderTime} onChange={(e) => setPreferences((prev) => ({ ...prev, reminderTime: e.target.value }))} className="px-3 py-1.5 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary" />
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">AI 告警通知</p>
                  <p className="text-xs text-text-muted">接收 AI 分析的告警推送</p>
                </div>
                <button onClick={() => setPreferences((prev) => ({ ...prev, alertsEnabled: !prev.alertsEnabled }))} className={cn("relative w-11 h-6 rounded-full transition-colors", preferences.alertsEnabled ? "bg-accent" : "bg-surface-3")}>
                  <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-transform", preferences.alertsEnabled ? "left-6" : "left-1")} />
                </button>
              </div>

              <div className="flex items-center justify-between px-4 py-3 opacity-50">
                <div>
                  <p className="text-sm font-medium text-text-primary">界面主题</p>
                  <p className="text-xs text-text-muted">深色模式</p>
                </div>
                <span className="px-2 py-1 text-xs bg-surface-3 rounded text-text-muted">仅深色</span>
              </div>
            </div>
          </section>

          {/* AI Configuration Section */}
          <section className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default">
              <Bot className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-medium text-text-primary">AI 模型配置</h2>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-text-muted mb-2 block">AI 服务提供商</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {aiProviders.map((provider) => (
                    <button key={provider.id} onClick={() => setAiConfig((prev) => ({ ...prev, provider: provider.id, model: provider.models[0] || "" }))} className={cn("px-3 py-2 text-sm font-medium rounded-lg border transition-colors", aiConfig.provider === provider.id ? "bg-accent/10 border-accent text-accent" : "bg-surface-2 border-border-default text-text-secondary hover:border-text-muted")}>
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>

              {currentProvider && currentProvider.models.length > 0 && (
                <div>
                  <label className="text-xs text-text-muted mb-2 block">模型选择</label>
                  <select value={aiConfig.model} onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))} className="w-full px-3 py-2 text-sm bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary">
                    {currentProvider.models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              )}

              {aiConfig.provider === "custom" && (
                <>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">Base URL</label>
                    <input type="text" value={aiConfig.baseUrl} onChange={(e) => setAiConfig((prev) => ({ ...prev, baseUrl: e.target.value }))} placeholder="https://api.example.com/v1" className="w-full px-3 py-2 text-sm bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">模型名称</label>
                    <input type="text" value={aiConfig.model} onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))} placeholder="model-name" className="w-full px-3 py-2 text-sm bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted" />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-text-muted mb-2 block">API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Key className="w-4 h-4 text-text-muted" />
                    </div>
                    <input type={showApiKey ? "text" : "password"} value={aiConfig.apiKey} onChange={(e) => { setAiConfig((prev) => ({ ...prev, apiKey: e.target.value })); setApiKeySaved(false) }} placeholder={apiKeySaved ? "已保存 (输入新 Key 覆盖)" : "sk-..."} className="w-full pl-9 pr-10 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted" />
                    <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button onClick={handleSaveApiKey} disabled={!aiConfig.apiKey || !userId || saving} className={cn("px-4 transition-colors", "bg-accent hover:bg-accent-hover text-accent-foreground")}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存"}
                  </Button>
                </div>
                <p className="text-xs text-text-muted mt-2">API Key 加密存储在本地数据库中</p>
              </div>

              {/* Test connection button */}
              {apiKeySaved && userId && (
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleTestAI} disabled={apiTesting} className="gap-2 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary">
                    {apiTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                    测试连接
                  </Button>
                  {apiTestResult && (
                    <span className={cn("text-xs", apiTestResult.status === "ok" ? "text-success" : "text-danger")}>
                      {apiTestResult.status === "ok" ? "连接成功" : `失败: ${apiTestResult.error}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Data Section */}
          <section className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
            <div className="px-4 py-3 border-b border-border-default">
              <h2 className="text-sm font-medium text-text-primary">数据管理</h2>
            </div>

            <div className="divide-y divide-border-default">
              <button onClick={handleExportData} disabled={!userId} className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors disabled:opacity-40">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-text-muted" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">导出历史数据</p>
                    <p className="text-xs text-text-muted">下载所有训练和身体数据 (JSON)</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </button>

              <div>
                {showDeleteConfirm ? (
                  <div className="px-4 py-3 space-y-3">
                    <p className="text-sm text-danger font-medium">确定要删除所有数据吗？此操作不可撤销。</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="bg-transparent border-border-default hover:bg-surface-3 text-text-secondary">取消</Button>
                      <Button size="sm" onClick={handleDeleteAllData} className="bg-danger hover:bg-danger/90 text-white">确认删除</Button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowDeleteConfirm(true)} disabled={!userId} className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors disabled:opacity-40">
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-danger" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-danger">清除所有数据</p>
                        <p className="text-xs text-text-muted">删除账户中的所有记录</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
            <button onClick={handleLogout} disabled={!userId} className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors disabled:opacity-40">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-text-muted" />
                <p className="text-sm font-medium text-text-primary">退出登录</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </button>
          </section>

          <div className="text-center text-xs text-text-muted py-4">
            <p>GymOps v1.0.0</p>
            <p className="mt-1">专业知识驱动的健身顾问工具</p>
            {userId && <p className="mt-1 font-mono opacity-50">ID: {userId.slice(0, 8)}...</p>}
          </div>
        </div>

        <BottomNav />
      </main>
    </div>
  )
}
