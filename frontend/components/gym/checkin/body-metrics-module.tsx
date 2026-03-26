"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, Scale, Percent, Ruler } from "lucide-react"
import { useState } from "react"

interface BodyMetricsModuleProps {
  initialData?: {
    weight?: number
    bodyFat?: number
    chest?: number
    waist?: number
    arm?: number
  }
}

export function BodyMetricsModule({ initialData }: BodyMetricsModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [data, setData] = useState({
    weight: initialData?.weight || "",
    bodyFat: initialData?.bodyFat || "",
    chest: initialData?.chest || "",
    waist: initialData?.waist || "",
    arm: initialData?.arm || "",
  })

  const hasData = data.weight || data.bodyFat

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">身体指标</h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-surface-3 text-text-muted rounded">
            可选
          </span>
          {hasData && (
            <span className="px-2 py-0.5 text-xs font-medium bg-success/15 text-success rounded">
              已填写
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border-default p-4 space-y-4">
          {/* Weight & Body Fat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs text-text-muted mb-2">
                <Scale className="w-3.5 h-3.5" />
                体重
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={data.weight}
                  onChange={(e) => setData({ ...data, weight: e.target.value })}
                  placeholder="78.5"
                  className="flex-1 px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                />
                <span className="text-xs text-text-muted">kg</span>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs text-text-muted mb-2">
                <Percent className="w-3.5 h-3.5" />
                体脂率
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={data.bodyFat}
                  onChange={(e) => setData({ ...data, bodyFat: e.target.value })}
                  placeholder="15.5"
                  className="flex-1 px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                />
                <span className="text-xs text-text-muted">%</span>
              </div>
            </div>
          </div>

          {/* Measurements Toggle */}
          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
          >
            <Ruler className="w-4 h-4" />
            {showMeasurements ? "收起围度测量" : "展开围度测量"}
          </button>

          {/* Measurements */}
          {showMeasurements && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs text-text-muted mb-2 block">胸围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={data.chest}
                    onChange={(e) => setData({ ...data, chest: e.target.value })}
                    placeholder="105"
                    className="flex-1 px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                  />
                  <span className="text-xs text-text-muted">cm</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">腰围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={data.waist}
                    onChange={(e) => setData({ ...data, waist: e.target.value })}
                    placeholder="80"
                    className="flex-1 px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                  />
                  <span className="text-xs text-text-muted">cm</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">臂围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={data.arm}
                    onChange={(e) => setData({ ...data, arm: e.target.value })}
                    placeholder="38"
                    className="flex-1 px-3 py-2 text-sm font-mono bg-surface-2 border border-border-default rounded-lg focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted"
                  />
                  <span className="text-xs text-text-muted">cm</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
