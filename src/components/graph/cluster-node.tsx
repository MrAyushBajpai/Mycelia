"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"

export type ClusterNodeData = {
  label: string
  color?: string
}

export const ClusterNode = memo(function ClusterNode({ data, selected }: NodeProps) {
  const d = data as ClusterNodeData
  const color = d.color || "#6366f1"

  return (
    <div
      className={cn(
        "rounded-3xl border-2 px-6 py-3 transition-all duration-500 relative animate-in zoom-in-90 duration-700 fade-in",
        "bg-black/80 backdrop-blur-xl shadow-2xl",
        selected ? "scale-110 shadow-[0_0_30px_var(--cluster-color)] z-10" : "hover:scale-105"
      )}
      style={{ 
        borderColor: color,
        "--cluster-color": `${color}40` // Add opacity to hex for shadow
      } as React.CSSProperties}
    >
      <div 
        className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-none !w-0 !h-0" />
      <div className="text-xs font-bold uppercase tracking-[0.2em] relative z-10" style={{ color, textShadow: `0 0 10px ${color}` }}>
        {d.label}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-none !w-0 !h-0" />
    </div>
  )
}
)
