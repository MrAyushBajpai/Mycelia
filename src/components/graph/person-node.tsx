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
        "rounded-full border px-5 py-2.5 transition-all duration-300 relative animate-in zoom-in-95 duration-500 fade-in",
        "bg-black/60 backdrop-blur-md border-white/10 text-white/90 shadow-xl",
        selected ? "ring-2 ring-primary shadow-[0_0_20px_rgba(0,240,255,0.4)] border-primary scale-105" : "hover:border-white/30 hover:scale-105",
        isOverdue && "border-destructive shadow-[0_0_15px_rgba(255,85,0,0.3)] ring-destructive"
      )}
    >
      {isOverdue && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse shadow-[0_0_10px_rgba(255,85,0,0.8)]" />
      )}
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-2 !h-2" />
      <div className="text-sm font-medium tracking-wide">{d.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-2 !h-2" />
    </div>
  )
}

)
