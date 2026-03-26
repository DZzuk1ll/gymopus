"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

interface DataPoint {
  date: string
  value: number
  label?: string
}

interface TrendChartProps {
  title: string
  data: DataPoint[]
  unit: string
  targetValue?: number
  color?: "accent" | "success" | "warning" | "danger"
  showArea?: boolean
  annotations?: { date: string; label: string }[]
}

export function TrendChart({
  title,
  data,
  unit,
  targetValue,
  color = "accent",
  showArea = true,
  annotations = [],
}: TrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const colorClasses = {
    accent: { stroke: "stroke-accent", fill: "fill-accent/20", dot: "bg-accent" },
    success: { stroke: "stroke-success", fill: "fill-success/20", dot: "bg-success" },
    warning: { stroke: "stroke-warning", fill: "fill-warning/20", dot: "bg-warning" },
    danger: { stroke: "stroke-danger", fill: "fill-danger/20", dot: "bg-danger" },
  }

  const colors = colorClasses[color]

  // Calculate bounds
  const values = data.map((d) => d.value)
  const minValue = Math.min(...values, targetValue || Infinity) * 0.9
  const maxValue = Math.max(...values, targetValue || 0) * 1.1
  const range = maxValue - minValue

  // SVG dimensions
  const width = 100
  const height = 40
  const padding = 2

  // Generate path
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((d.value - minValue) / range) * (height - padding * 2)
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`

  // Target line Y position
  const targetY = targetValue
    ? height - padding - ((targetValue - minValue) / range) * (height - padding * 2)
    : null

  const latestValue = data[data.length - 1]?.value
  const previousValue = data[data.length - 2]?.value
  const change = previousValue ? ((latestValue - previousValue) / previousValue) * 100 : 0

  return (
    <div className="bg-surface-1 rounded-xl border border-border-default p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold font-mono text-text-primary">
            {latestValue?.toLocaleString()}
          </span>
          <span className="text-xs text-text-muted">{unit}</span>
          {change !== 0 && (
            <span
              className={cn(
                "text-xs font-medium",
                change > 0 ? "text-success" : "text-danger"
              )}
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-32">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Grid lines */}
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            className="stroke-border-default"
            strokeWidth="0.3"
            strokeDasharray="1 1"
          />

          {/* Target line */}
          {targetY && (
            <line
              x1={padding}
              y1={targetY}
              x2={width - padding}
              y2={targetY}
              className="stroke-text-muted"
              strokeWidth="0.3"
              strokeDasharray="2 2"
            />
          )}

          {/* Area */}
          {showArea && <path d={areaPath} className={colors.fill} />}

          {/* Line */}
          <path d={linePath} fill="none" className={colors.stroke} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                className="fill-transparent cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              />
              {hoveredIndex === i && (
                <circle cx={point.x} cy={point.y} r="1" className={colors.dot.replace("bg-", "fill-")} />
              )}
            </g>
          ))}

          </svg>

        {/* Annotation markers - positioned outside SVG to maintain circular shape */}
        {annotations.map((ann, i) => {
          const point = points.find((p) => p.date === ann.date)
          if (!point) return null
          return (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-warning border border-surface-1 shadow-sm -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `${(point.x / width) * 100}%`,
                top: `${(point.y / height) * 100}%`,
              }}
            />
          )
        })}

        {/* Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute pointer-events-none bg-surface-2 border border-border-default rounded-lg px-2 py-1 shadow-lg z-10"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <p className="text-xs font-mono text-text-primary whitespace-nowrap">
              {points[hoveredIndex].value.toLocaleString()} {unit}
            </p>
            <p className="text-[10px] text-text-muted">{points[hoveredIndex].date}</p>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-[10px] text-text-muted">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>

      {/* Legend */}
      {targetValue && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-default">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className={cn("w-3 h-0.5 rounded", colors.dot)} />
            <span>实际值</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-3 h-0.5 bg-text-muted rounded" style={{ background: "repeating-linear-gradient(90deg, var(--text-muted), var(--text-muted) 2px, transparent 2px, transparent 4px)" }} />
            <span>目标 {targetValue}{unit}</span>
          </div>
        </div>
      )}
    </div>
  )
}
