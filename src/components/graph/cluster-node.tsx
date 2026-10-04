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
        "rounded-full border-[1.5px] px-6 py-3 transition-all duration-300 cursor-pointer group",
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
      <Handle type="target" position={Position.Top} id="top" className="absolute opacity-0 !w-3 !h-3 after:content-[''] after:absolute after:-inset-4 after:bg-transparent" />
      <Handle type="source" position={Position.Top} id="top" className="!bg-[#18181b] !border-[1.5px] !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:!bg-white/30 hover:scale-125 after:content-[''] after:absolute after:-inset-4 after:bg-transparent" style={{ borderColor: color }} />
      <Handle type="target" position={Position.Right} id="right" className="absolute opacity-0 !w-3 !h-3 after:content-[''] after:absolute after:-inset-4 after:bg-transparent" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#18181b] !border-[1.5px] !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:!bg-white/30 hover:scale-125 after:content-[''] after:absolute after:-inset-4 after:bg-transparent" style={{ borderColor: color }} />
      <Handle type="target" position={Position.Bottom} id="bottom" className="absolute opacity-0 !w-3 !h-3 after:content-[''] after:absolute after:-inset-4 after:bg-transparent" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#18181b] !border-[1.5px] !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:!bg-white/30 hover:scale-125 after:content-[''] after:absolute after:-inset-4 after:bg-transparent" style={{ borderColor: color }} />
      <Handle type="target" position={Position.Left} id="left" className="absolute opacity-0 !w-3 !h-3 after:content-[''] after:absolute after:-inset-4 after:bg-transparent" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-[#18181b] !border-[1.5px] !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:!bg-white/30 hover:scale-125 after:content-[''] after:absolute after:-inset-4 after:bg-transparent" style={{ borderColor: color }} />

      <div 
        className="text-[12px] font-medium uppercase tracking-[0.15em]" 
        style={{ color }}
      >
        {d.label}
      </div>
    </div>
  )
}
)
