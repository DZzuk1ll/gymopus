"use client"

import { AlertCircle } from "lucide-react"

export function Disclaimer() {
  return (
    <div className="flex items-start gap-3 p-4 bg-surface-1 rounded-xl border border-border-default">
      <AlertCircle className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
      <p className="text-xs text-text-muted leading-relaxed">
        所有建议基于运动科学文献（NSCA / ACSM），不构成医学诊断或处方。如有伤病或慢性疾病，请咨询医生或持证营养师。用户对自身训练行为承担全部责任。
      </p>
    </div>
  )
}
