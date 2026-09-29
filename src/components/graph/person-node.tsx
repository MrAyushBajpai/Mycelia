"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { useTimeStore } from "@/stores/time-store"

export type PersonNodeData = {
  label: string
  lastContacted?: string | null
  cadenceDays?: number | null
}

export const PersonNode = memo(function PersonNode({ data, selected }: NodeProps) {
  const d = data as PersonNodeData
  const now = useTimeStore((s) => s.now)
  
  let isOverdue = false
  if (d.cadenceDays && d.lastContacted) {
    const last = new Date(d.lastContacted).getTime()
    const diffDays = (now - last) / (1000 * 60 * 60 * 24)
    if (diffDays > d.cadenceDays) {
      isOverdue = true
    }
  } else if (d.cadenceDays && !d.lastContacted) {
    isOverdue = true // Never contacted, but has cadence
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow relative",
        selected && "ring-2 ring-primary shadow-md",
        isOverdue && "border-amber-500/50 bg-amber-500/5"
      )}
    >
      {isOverdue && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
      )}
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      <div className="text-sm font-medium">{d.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  )
}

)
