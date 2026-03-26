"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar } from "@/components/gym/top-bar"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Clock,
  Sparkles,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Moon,
  Dumbbell,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Signal {
  id: string
  description: string
  value: string
  trend: "up" | "down" | "neutral"
}

interface Reference {
  source: string
  section: string
  summary: string
}

interface Suggestion {
  id: string
  title: string
  severity: "info" | "warning" | "danger"
  triggerType: "rule" | "ai"
  status: "pending" | "adopted" | "ignored"
  createdAt: string
  signals: Signal[]
  analysis: string
  recommendations: string[]
  alternatives: string[]
  references: Reference[]
}

const suggestions: Suggestion[] = [
  {
    id: "1",
    title: "训练负荷过度累积风险",
    severity: "warning",
    triggerType: "ai",
    status: "pending",
    createdAt: "2024-03-22 14:30",
    signals: [
      {
        id: "s1",
        description: "周训练容量连续 2 周上升",
        value: "+15%",
        trend: "up",
      },
      {
        id: "s2",
        description: "平均睡眠时长下降",
        value: "-0.5h/晚",
        trend: "down",
      },
      {
        id: "s3",
        description: "周五 RPE 自评连续高于计划值",
        value: "RPE 9 vs 目标 8",
        trend: "up",
      },
    ],
    analysis:
      "综合训练容量持续上升、睡眠质量下降和主观疲劳度增加三个信号，系统判断当前存在过度训练风险。持续的高负荷训练叠加恢复不足可能导致训练效果下降甚至伤病。",
    recommendations: [
      "本周四安排 Deload，主项组数减少 2 组",
      "将 RPE 目标下调至 7，关注动作质量",
      "确保每晚睡眠不少于 7.5 小时",
    ],
    alternatives: [
      "将周四改为主动恢复日（低强度有氧 + 拉伸）",
      "保持训练安排但将重量下调 10%",
    ],
    references: [
      {
        source: "NSCA Essentials of Strength Training and Conditioning",
        section: "Chapter 22 - Program Design",
        summary: "渐进超负荷原则建议每周容量增幅不超过 10%，连续高负荷训练超过 4 周应安排减载周",
      },
      {
        source: "ACSM Guidelines for Exercise Testing and Prescription",
        section: "Chapter 7 - Overtraining",
        summary: "睡眠质量下降、主观疲劳度增加是过度训练综合征的早期预警信号",
      },
    ],
  },
  {
    id: "2",
    title: "蛋白质摄入波动较大",
    severity: "info",
    triggerType: "rule",
    status: "pending",
    createdAt: "2024-03-21 09:15",
    signals: [
      {
        id: "s4",
        description: "蛋白质摄入标准差",
        value: "±35g/天",
        trend: "neutral",
      },
      {
        id: "s5",
        description: "周末蛋白质平均摄入",
        value: "仅 120g",
        trend: "down",
      },
    ],
    analysis:
      "过去两周蛋白质摄入在工作日和周末存在明显差异，周末摄入量明显低于目标。稳定的蛋白质摄入对肌肉蛋白合成至关重要。",
    recommendations: [
      "周末提前准备高蛋白食物或备好蛋白粉",
      "设置周末蛋白质摄入提醒",
    ],
    alternatives: [
      "周末增加一餐蛋白质加餐",
    ],
    references: [
      {
        source: "Journal of the International Society of Sports Nutrition",
        section: "Protein Timing Position Stand",
        summary: "每日蛋白质摄入应均匀分布在 4-5 餐中，每餐 0.4-0.55g/kg 体重",
      },
    ],
  },
  {
    id: "3",
    title: "睡眠时长连续 3 天低于阈值",
    severity: "danger",
    triggerType: "rule",
    status: "adopted",
    createdAt: "2024-03-18 07:00",
    signals: [
      {
        id: "s6",
        description: "连续 3 天睡眠低于 6 小时",
        value: "5.5h 平均",
        trend: "down",
      },
    ],
    analysis: "规则触发：连续 3 天睡眠时长低于 6 小时阈值。睡眠不足会显著影响恢复能力和训练表现。",
    recommendations: [
      "当晚提前 1 小时上床",
      "减少训练前咖啡因摄入",
      "考虑调整次日训练强度",
    ],
    alternatives: [],
    references: [
      {
        source: "Sleep Foundation Guidelines",
        section: "Athletes and Sleep",
        summary: "运动员建议每晚 7-9 小时睡眠，睡眠不足会降低力量、耐力和反应速度",
      },
    ],
  },
]

const severityConfig = {
  info: {
    icon: Info,
    bg: "bg-info-muted",
    border: "border-info/30",
    text: "text-info",
    label: "提示",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-warning-muted",
    border: "border-warning/30",
    text: "text-warning",
    label: "警告",
  },
  danger: {
    icon: AlertTriangle,
    bg: "bg-danger-muted",
    border: "border-danger/30",
    text: "text-danger",
    label: "严重",
  },
}

const statusConfig = {
  pending: { label: "待处理", bg: "bg-warning/15", text: "text-warning" },
  adopted: { label: "已采纳", bg: "bg-success/15", text: "text-success" },
  ignored: { label: "已忽略", bg: "bg-surface-3", text: "text-text-muted" },
}

export default function SuggestionsPage() {
  const [expandedId, setExpandedId] = useState<string | null>("1")
  const [suggestionsList, setSuggestionsList] = useState(suggestions)

  const updateStatus = (id: string, status: "adopted" | "ignored" | "deferred") => {
    setSuggestionsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    )
    setExpandedId(null)
  }

  const pendingCount = suggestionsList.filter((s) => s.status === "pending").length

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-[240px]">
        <TopBar
          title="AI 建议"
          badge={pendingCount > 0 ? `${pendingCount} 条待处理` : undefined}
          showDate={false}
        />

        <div className="p-4 lg:p-6 pb-24 lg:pb-6 space-y-4">
          {/* Suggestions List */}
          {suggestionsList.map((suggestion) => {
            const isExpanded = expandedId === suggestion.id
            const severity = severityConfig[suggestion.severity]
            const status = statusConfig[suggestion.status]
            const SeverityIcon = severity.icon

            return (
              <div
                key={suggestion.id}
                className={cn(
                  "rounded-xl border overflow-hidden transition-all",
                  isExpanded ? severity.bg : "bg-surface-1",
                  isExpanded ? severity.border : "border-border-default"
                )}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-surface-2/50 transition-colors"
                >
                  <div className={cn("p-2 rounded-lg", severity.bg)}>
                    <SeverityIcon className={cn("w-4 h-4", severity.text)} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-medium text-text-primary">{suggestion.title}</h3>
                      <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", severity.bg, severity.text)}>
                        {severity.label}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-surface-3 text-text-muted rounded">
                        {suggestion.triggerType === "ai" ? "AI 分析" : "规则触发"}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{suggestion.createdAt}</p>
                  </div>
                  <span className={cn("px-2 py-1 text-xs font-medium rounded", status.bg, status.text)}>
                    {status.label}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border-default">
                    {/* Signals */}
                    <div className="p-4 border-b border-border-default">
                      <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                        检测到的信号
                      </h4>
                      <div className="space-y-2">
                        {suggestion.signals.map((signal) => (
                          <div
                            key={signal.id}
                            className="flex items-center gap-3 p-2 bg-surface-2 rounded-lg"
                          >
                            {signal.trend === "up" ? (
                              <TrendingUp className="w-4 h-4 text-warning" />
                            ) : signal.trend === "down" ? (
                              <TrendingDown className="w-4 h-4 text-danger" />
                            ) : (
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-2 h-0.5 bg-text-muted rounded" />
                              </div>
                            )}
                            <span className="flex-1 text-sm text-text-primary">{signal.description}</span>
                            <span className="text-sm font-mono text-accent">{signal.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Analysis */}
                    <div className="p-4 border-b border-border-default">
                      <h4 className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        多信号交叉分析
                      </h4>
                      <p className="text-sm text-text-secondary leading-relaxed">{suggestion.analysis}</p>
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 border-b border-border-default">
                      <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                        修正建议
                      </h4>
                      <div className="space-y-2">
                        {suggestion.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-5 h-5 flex items-center justify-center rounded bg-success/15 text-success text-xs font-medium mt-0.5">
                              {i + 1}
                            </div>
                            <p className="text-sm text-text-primary">{rec}</p>
                          </div>
                        ))}
                      </div>
                      {suggestion.alternatives.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border-default">
                          <p className="text-xs text-text-muted mb-2">替代方案</p>
                          {suggestion.alternatives.map((alt, i) => (
                            <p key={i} className="text-sm text-text-secondary">
                              • {alt}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* References */}
                    <div className="p-4 border-b border-border-default">
                      <h4 className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                        <BookOpen className="w-3.5 h-3.5" />
                        知识库引用
                      </h4>
                      <div className="space-y-3">
                        {suggestion.references.map((ref, i) => (
                          <div key={i} className="p-3 bg-surface-2 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-accent">{ref.source}</span>
                              <ExternalLink className="w-3 h-3 text-text-muted" />
                            </div>
                            <p className="text-xs font-mono text-text-muted mb-1">{ref.section}</p>
                            <p className="text-sm text-text-secondary">{ref.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {suggestion.status === "pending" && (
                      <div className="p-4 bg-surface-2 flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => updateStatus(suggestion.id, "adopted")}
                          className="flex-1 gap-2 bg-success hover:bg-success-hover text-success-foreground"
                        >
                          <Check className="w-4 h-4" />
                          采纳建议
                        </Button>
                        <Button
                          onClick={() => updateStatus(suggestion.id, "ignored")}
                          variant="outline"
                          className="flex-1 gap-2 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary"
                        >
                          <X className="w-4 h-4" />
                          忽略
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => updateStatus(suggestion.id, "deferred")}
                          className="flex-1 gap-2 bg-transparent border-border-default hover:bg-surface-3 text-text-secondary"
                        >
                          <Clock className="w-4 h-4" />
                          稍后处理
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <BottomNav />
      </main>
    </div>
  )
}
