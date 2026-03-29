"use client"

import { Sidebar } from "@/components/gym/sidebar"
import { BottomNav } from "@/components/gym/bottom-nav"
import { TopBar } from "@/components/gym/top-bar"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { apiFetch, getStoredUserId } from "@/lib/api"
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
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Signal {
  id: string
  description: string
  value: string
  trend: "up" | "down" | "neutral" | null
}

interface Reference {
  source: string
  section: string | null
  summary: string
}

interface SuggestionBrief {
  id: string
  title: string
  severity: string
  trigger_type: string
  status: string
  created_at: string | null
}

interface SuggestionDetail extends SuggestionBrief {
  signals: Signal[]
  analysis: string
  recommendations: string[]
  alternatives: string[]
  references: Reference[]
  confidence: number | null
}

const severityConfig: Record<string, { icon: any; bg: string; border: string; text: string; label: string }> = {
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

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "待处理", bg: "bg-warning/15", text: "text-warning" },
  adopted: { label: "已采纳", bg: "bg-success/15", text: "text-success" },
  ignored: { label: "已忽略", bg: "bg-surface-3", text: "text-text-muted" },
  deferred: { label: "已推迟", bg: "bg-info/15", text: "text-info" },
}

export default function SuggestionsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [suggestionsList, setSuggestionsList] = useState<SuggestionBrief[]>([])
  const [detailsCache, setDetailsCache] = useState<Record<string, SuggestionDetail>>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)

  const fetchSuggestions = async () => {
    const userId = getStoredUserId()
    if (!userId) { setLoading(false); return }
    try {
      const data = await apiFetch<SuggestionBrief[]>(`/api/v1/suggestions?user_id=${userId}`)
      setSuggestionsList(data)
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSuggestions() }, [])

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)

    // Fetch detail if not cached
    if (!detailsCache[id]) {
      setLoadingDetail(id)
      try {
        const detail = await apiFetch<SuggestionDetail>(`/api/v1/suggestions/${id}`)
        setDetailsCache((prev) => ({ ...prev, [id]: detail }))
      } catch { }
      finally { setLoadingDetail(null) }
    }
  }

  const updateStatus = async (id: string, status: "adopted" | "ignored" | "deferred") => {
    try {
      const updated = await apiFetch<SuggestionDetail>(`/api/v1/suggestions/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      setSuggestionsList((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
      setDetailsCache((prev) => ({ ...prev, [id]: updated }))
      setExpandedId(null)
    } catch { }
  }

  const handleTriggerAnalysis = async () => {
    const userId = getStoredUserId()
    if (!userId) return
    setGenerating(true)
    try {
      await apiFetch("/api/v1/suggestions/trigger", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      })
      // Refresh list
      const data = await apiFetch<SuggestionBrief[]>(`/api/v1/suggestions?user_id=${userId}`)
      setSuggestionsList(data)
      setDetailsCache({})
    } catch { }
    finally { setGenerating(false) }
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
          {/* Trigger Analysis Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleTriggerAnalysis}
              disabled={generating}
              className="gap-2 bg-accent hover:bg-accent-hover text-accent-foreground"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "分析中..." : "触发分析"}
            </Button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : suggestionsList.length === 0 ? (
            <div className="text-center py-16">
              <RefreshCw className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary">暂无建议</p>
              <p className="text-xs text-text-muted mt-1">完成几天的打卡记录后，点击"触发分析"生成 AI 建议</p>
            </div>
          ) : (
            /* Suggestions List */
            suggestionsList.map((suggestion) => {
              const isExpanded = expandedId === suggestion.id
              const severity = severityConfig[suggestion.severity] || severityConfig.info
              const status = statusConfig[suggestion.status] || statusConfig.pending
              const SeverityIcon = severity.icon
              const detail = detailsCache[suggestion.id]
              const isLoadingThis = loadingDetail === suggestion.id

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
                    onClick={() => handleExpand(suggestion.id)}
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
                          {suggestion.trigger_type === "ai" ? "AI 分析" : "规则触发"}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{suggestion.created_at || ""}</p>
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
                      {isLoadingThis || !detail ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-accent" />
                        </div>
                      ) : (
                        <>
                          {/* Signals */}
                          {detail.signals.length > 0 && (
                            <div className="p-4 border-b border-border-default">
                              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                                检测到的信号
                              </h4>
                              <div className="space-y-2">
                                {detail.signals.map((signal) => (
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
                          )}

                          {/* Analysis */}
                          <div className="p-4 border-b border-border-default">
                            <h4 className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                              <Sparkles className="w-3.5 h-3.5 text-accent" />
                              多信号交叉分析
                            </h4>
                            <p className="text-sm text-text-secondary leading-relaxed">{detail.analysis}</p>
                          </div>

                          {/* Recommendations */}
                          {detail.recommendations.length > 0 && (
                            <div className="p-4 border-b border-border-default">
                              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                                修正建议
                              </h4>
                              <div className="space-y-2">
                                {detail.recommendations.map((rec, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <div className="w-5 h-5 flex items-center justify-center rounded bg-success/15 text-success text-xs font-medium mt-0.5">
                                      {i + 1}
                                    </div>
                                    <p className="text-sm text-text-primary">{rec}</p>
                                  </div>
                                ))}
                              </div>
                              {detail.alternatives.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border-default">
                                  <p className="text-xs text-text-muted mb-2">替代方案</p>
                                  {detail.alternatives.map((alt, i) => (
                                    <p key={i} className="text-sm text-text-secondary">
                                      • {alt}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* References */}
                          {detail.references.length > 0 && (
                            <div className="p-4 border-b border-border-default">
                              <h4 className="flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                                <BookOpen className="w-3.5 h-3.5" />
                                知识库引用
                              </h4>
                              <div className="space-y-3">
                                {detail.references.map((ref, i) => (
                                  <div key={i} className="p-3 bg-surface-2 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium text-accent">{ref.source}</span>
                                      <ExternalLink className="w-3 h-3 text-text-muted" />
                                    </div>
                                    {ref.section && (
                                      <p className="text-xs font-mono text-text-muted mb-1">{ref.section}</p>
                                    )}
                                    <p className="text-sm text-text-secondary">{ref.summary}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <BottomNav />
      </main>
    </div>
  )
}
