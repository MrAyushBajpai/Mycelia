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
        "rounded-full border-[1.5px] px-6 py-3 transition-all duration-300 cursor-pointer",
        selected 
          ? "scale-110 z-10" 
          : "hover:scale-105"
      )}
      style={{ 
        borderColor: `${color}90`,
        backgroundColor: `${color}26`,
        boxShadow: selected 
          ? `0 0 32px ${color}25, 0 0 12px ${color}15` 
          : 'none',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-[#18181b] !border-[1.5px] !w-3 !h-3 transition-colors hover:!bg-white/30"
        style={{ borderColor: color }}
      />
      <div 
        className="text-[12px] font-medium uppercase tracking-[0.15em]" 
        style={{ color }}
      >
        {d.label}
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-[#09090b] !border-[1.5px] !w-2.5 !h-2.5 transition-colors hover:!bg-white/30"
        style={{ borderColor: color }}
      />
    </div>
  )
}
)
