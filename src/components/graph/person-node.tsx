"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"

export type PersonNodeData = {
  label: string
  lastContacted?: string | null
  cadenceDays?: number | null
}

export function PersonNode({ data, selected }: NodeProps) {
  const d = data as PersonNodeData

  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow",
        selected && "ring-2 ring-primary shadow-md"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      <div className="text-sm font-medium">{d.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  )
}
