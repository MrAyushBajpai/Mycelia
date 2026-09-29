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
        "rounded-full border px-4 py-2 transition-all duration-300 cursor-pointer",
        "bg-white/[0.05] border-white/[0.1] text-white/90",
        selected 
          ? "border-primary/50 scale-105" 
          : "hover:border-white/20 hover:scale-[1.03]",
        isOverdue && !selected && "border-destructive/60"
      )}
      style={{
        boxShadow: selected
          ? '0 0 24px rgba(0,240,255,0.2), 0 0 8px rgba(0,240,255,0.1)'
          : isOverdue && !selected
            ? '0 0 16px rgba(255,85,0,0.2)'
            : 'none',
      }}
    >
      {isOverdue && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
      )}
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-semibold text-white/60 shrink-0 uppercase">
          {d.label.charAt(0)}
        </div>
        <span className="text-sm font-medium tracking-wide">{d.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-2 !h-2" />
    </div>
  )
}

)
