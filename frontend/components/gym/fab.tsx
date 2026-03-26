"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

export function FAB() {
  return (
    <Link
      href="/checkin"
      className="lg:hidden fixed right-4 bottom-20 z-50 flex items-center justify-center w-14 h-14 bg-accent hover:bg-accent-hover text-accent-foreground rounded-full shadow-lg shadow-accent/25 transition-all active:scale-95"
    >
      <Plus className="w-6 h-6" />
    </Link>
  )
}
