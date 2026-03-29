"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Check, Clock } from "lucide-react"
import { useState, useEffect } from "react"

interface Supplement {
  id: string
  name: string
  dosage: string
  time: string
  taken: boolean
}

interface SupplementsModuleProps {
  supplements: Supplement[]
  onSupplementsChange?: (supplements: Supplement[]) => void
}

export function SupplementsModule({ supplements: initialSupplements, onSupplementsChange }: SupplementsModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [supplements, setSupplements] = useState(initialSupplements)

  useEffect(() => { onSupplementsChange?.(supplements) }, [supplements])

  const toggleSupplement = (id: string) => {
    setSupplements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, taken: !s.taken } : s))
    )
  }

  const takenCount = supplements.filter((s) => s.taken).length

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">补剂打卡</h3>
          <span className={cn(
            "px-2 py-0.5 text-xs font-medium rounded",
            takenCount === supplements.length ? "bg-success/15 text-success" : "bg-surface-3 text-text-secondary"
          )}>
            {takenCount}/{supplements.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border-default divide-y divide-border-default">
          {supplements.map((supplement) => (
            <button
              key={supplement.id}
              onClick={() => toggleSupplement(supplement.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-colors",
                supplement.taken ? "bg-success/5" : "hover:bg-surface-2"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded border-2 transition-colors",
                  supplement.taken
                    ? "bg-success border-success"
                    : "border-border-hover"
                )}
              >
                {supplement.taken && <Check className="w-3 h-3 text-success-foreground" />}
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  "text-sm font-medium",
                  supplement.taken ? "text-text-muted line-through" : "text-text-primary"
                )}>
                  {supplement.name}
                </p>
                <p className="text-xs text-text-muted">{supplement.dosage}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                <span>{supplement.time}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
