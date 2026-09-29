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
        "rounded-2xl border-2 px-5 py-3 shadow-sm transition-shadow",
        selected && "shadow-md"
      )}
      style={{ borderColor: color }}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
        {d.label}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  )
}
