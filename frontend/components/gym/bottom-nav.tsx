"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react"

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "打卡",
    href: "/checkin",
    icon: ClipboardCheck,
  },
  {
    label: "计划",
    href: "/plan",
    icon: Calendar,
  },
  {
    label: "趋势",
    href: "/trends",
    icon: TrendingUp,
  },
  {
    label: "更多",
    href: "/settings",
    icon: MoreHorizontal,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-1/95 backdrop-blur-lg border-t border-border-default safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-12 rounded-lg transition-colors",
                isActive ? "text-accent" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
