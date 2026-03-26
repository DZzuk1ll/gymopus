"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, X, ChevronRight, Sparkles } from "lucide-react"
import { useState } from "react"

interface AlertBannerProps {
  title: string
  description: string
  source?: string
  severity?: "info" | "warning" | "danger"
  onDismiss?: () => void
  onViewDetails?: () => void
}

export function AlertBanner({
  title,
  description,
  source,
  severity = "warning",
  onDismiss,
  onViewDetails,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const severityStyles = {
    info: {
      bg: "bg-info-muted",
      border: "border-info/30",
      icon: "text-info",
      pulse: "bg-info",
    },
    warning: {
      bg: "bg-warning-muted",
      border: "border-warning/30",
      icon: "text-warning",
      pulse: "bg-warning",
    },
    danger: {
      bg: "bg-danger-muted",
      border: "border-danger/30",
      icon: "text-danger",
      pulse: "bg-danger",
    },
  }

  const styles = severityStyles[severity]

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border transition-all",
        styles.bg,
        styles.border
      )}
    >
      {/* Pulse Indicator */}
      <div className="relative flex-shrink-0 mt-0.5">
        <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse-glow", styles.pulse)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium text-text-primary">{title}</h4>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-surface-2 text-accent rounded">
            <Sparkles className="w-2.5 h-2.5" />
            AI 分析
          </span>
        </div>
        <p className="text-sm text-text-secondary mb-2">{description}</p>
        {source && (
          <p className="text-xs font-mono text-text-muted mb-2">
            来源: {source}
          </p>
        )}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            查看完整分析
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-surface-2 transition-colors"
      >
        <X className="w-4 h-4 text-text-muted" />
      </button>
    </div>
  )
}
