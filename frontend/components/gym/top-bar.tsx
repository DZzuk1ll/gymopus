"use client"

import { Button } from "@/components/ui/button"
import { CalendarDays, Download, Plus } from "lucide-react"
import Link from "next/link"

interface TopBarProps {
  title: string
  subtitle?: string
  badge?: string
  showDate?: boolean
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, badge, showDate = true, actions }: TopBarProps) {
  const today = new Date()
  const dateStr = today.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 lg:px-6 bg-background/80 backdrop-blur-lg border-b border-border-default">
      <div className="flex items-center gap-3">
        <h1 className="text-lg lg:text-xl font-semibold text-text-primary">{title}</h1>
        {badge && (
          <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium bg-accent/15 text-accent rounded-md">
            {badge}
          </span>
        )}
        {subtitle && (
          <span className="hidden md:inline-flex text-sm text-text-muted">{subtitle}</span>
        )}
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        {showDate && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
            <CalendarDays className="w-4 h-4" />
            <span>{dateStr}</span>
          </div>
        )}
        {actions}
      </div>
    </header>
  )
}

export function DashboardActions() {
  const handleExportWeekly = async () => {
    try {
      const { getStoredUserId } = await import("@/lib/api")
      const { apiFetch } = await import("@/lib/api")
      const userId = getStoredUserId()
      if (!userId) { alert("请先在设置中创建用户"); return }
      const today = new Date().toISOString().slice(0, 10)
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      const [user, checkins] = await Promise.all([
        apiFetch(`/api/v1/users/${userId}`),
        apiFetch(`/api/v1/checkins/${userId}?start=${weekAgo}&end=${today}`),
      ])
      const blob = new Blob([JSON.stringify({ user, checkins, period: { start: weekAgo, end: today } }, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gymops-weekly-${today}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message || "导出失败")
    }
  }

  return (
    <>
      <Button onClick={handleExportWeekly} variant="outline" size="sm" className="hidden sm:flex gap-2 bg-surface-2 border-border-default hover:bg-surface-3 hover:border-border-hover text-text-secondary">
        <Download className="w-4 h-4" />
        <span className="hidden lg:inline">导出周报</span>
      </Button>
      <Link href="/checkin">
        <Button size="sm" className="gap-2 bg-accent hover:bg-accent-hover text-accent-foreground">
          <Plus className="w-4 h-4" />
          <span>今日打卡</span>
        </Button>
      </Link>
    </>
  )
}
