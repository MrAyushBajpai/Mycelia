"use client"

import { memo, useState, useRef, useMemo } from "react"
import { Handle, Position, NodeToolbar, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { useTimeStore } from "@/stores/time-store"
import { useGraphStore } from "@/stores/graph-store"

import { useNotificationStore } from "@/stores/notification-store"

export type PersonNodeData = {
  label: string
  lastContacted?: string | null
  cadenceDays?: number | null
  nextActionReason?: string | null
}

export const PersonNode = memo(function PersonNode({ id, data, selected }: NodeProps) {
  const d = data as PersonNodeData
  const now = useTimeStore((s) => s.now)
  
  const edges = useGraphStore((s) => s.edges)
  const nodes = useGraphStore((s) => s.nodes)

  const notifications = useNotificationStore((s) => s.notifications)
  const unreadForNode = notifications.filter(n => !n.isRead && n.nodeId === id)
  
  const isEvent = unreadForNode.some(n => n.type === 'event')
  const isOverdue = unreadForNode.some(n => n.type === 'overdue')
  const isDueSoon = unreadForNode.some(n => n.type === 'due')

  const [isHovering, setIsHovering] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  let lastContactedStr = "Never"

  if (d.lastContacted) {
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const last = new Date(d.lastContacted)
    last.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000)
    
    if (diffDays === 0) lastContactedStr = "Today"
    else if (diffDays === 1) lastContactedStr = "Yesterday"
    else lastContactedStr = `${diffDays} days ago`
  }

  const connectedLabels = useMemo(() => {
    if (!showTooltip) return []
    const connectedIds = edges
      .filter(e => e.source === id || e.target === id)
      .map(e => e.source === id ? e.target : e.source)
    return nodes
      .filter(n => connectedIds.includes(n.id))
      .map(n => String((n.data as any).label))
  }, [showTooltip, edges, nodes, id])

  const handleMouseEnter = () => {
    setIsHovering(true)
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 800)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setShowTooltip(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handleMouseLeave}
    >
      <div
        className={cn(
          "rounded-full border px-4 py-2 transition-all duration-300 cursor-pointer relative z-10",
          "bg-zinc-900/95 border-white/[0.15] text-white/90",
          selected 
            ? "border-primary/50 scale-105" 
            : "hover:border-white/20 hover:scale-[1.03]",
          isEvent && !selected && "border-purple-500/60",
          isOverdue && !isEvent && !selected && "border-destructive/60",
          isDueSoon && !isEvent && !isOverdue && !selected && "border-amber-500/60"
        )}
        style={{
          boxShadow: selected
            ? '0 0 24px rgba(0,240,255,0.2), 0 0 8px rgba(0,240,255,0.1)'
            : isEvent && !selected
              ? '0 0 16px rgba(168,85,247,0.2)'
              : isOverdue && !selected
                ? '0 0 16px rgba(255,85,0,0.2)'
                : isDueSoon && !selected
                  ? '0 0 16px rgba(245,158,11,0.2)'
                  : 'none',
        }}
      >
        {isEvent && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse" />
        )}
        {isOverdue && !isEvent && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
        )}
        {isDueSoon && !isOverdue && !isEvent && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
        )}
        {/* 4-way handles: connectionMode=Loose allows sourceâ†’source connections */}
        <Handle type="target" position={Position.Top} id="top" className="absolute opacity-0 !w-3 !h-3" />
        <Handle type="source" position={Position.Top} id="top" className="!bg-[#18181b] !border-[1.5px] !border-white/40 !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:!bg-white/30 hover:scale-125" />
        
        <Handle type="target" position={Position.Right} id="right" className="absolute opacity-0 !w-3 !h-3" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-[#18181b] !border-[1.5px] !border-white/40 !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:!bg-white/30 hover:scale-125" />
        
        <Handle type="target" position={Position.Bottom} id="bottom" className="absolute opacity-0 !w-3 !h-3" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#18181b] !border-[1.5px] !border-white/40 !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:!bg-white/30 hover:scale-125" />
        
        <Handle type="target" position={Position.Left} id="left" className="absolute opacity-0 !w-3 !h-3" />
        <Handle type="source" position={Position.Left} id="left" className="!bg-[#18181b] !border-[1.5px] !border-white/40 !w-3 !h-3 !rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:!bg-white/30 hover:scale-125" />

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-semibold text-white/60 shrink-0 uppercase relative overflow-hidden">
            {/* Tiny circular progress indicator behind the initial */}
            <div 
              className={cn(
                "absolute inset-0 bg-primary/30 origin-bottom transition-transform ease-linear",
                isHovering && !showTooltip ? "duration-[800ms] scale-y-100" : "duration-0 scale-y-0"
              )} 
            />
            <span className="relative z-10">{d.label.charAt(0)}</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">{d.label}</span>
        </div>
      </div>

      <NodeToolbar isVisible={showTooltip} position={Position.Bottom} offset={12}>
        <div className="p-3.5 bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.8)] w-48 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          <div className="flex flex-col gap-2.5">
            <div className="border-b border-white/5 pb-2">
               <span className="text-[15px] font-semibold text-white/90">{d.label}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Connections</span>
              <span className="text-[12px] text-white/70 line-clamp-2 leading-relaxed">
                {connectedLabels.length > 0 ? connectedLabels.join(" Â· ") : "None"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Last Contact</span>
              <span className={`text-[12px] ${isOverdue ? "text-destructive font-medium" : isDueSoon ? "text-amber-500 font-medium" : "text-white/70"}`}>
                {lastContactedStr}
              </span>
            </div>
            {d.nextActionReason && (
              <div className="flex flex-col gap-0.5 mt-1 border-t border-white/5 pt-2">
                <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Next Action</span>
                <span className="text-[12px] text-white/90 leading-relaxed">{d.nextActionReason}</span>
              </div>
            )}
          </div>
        </div>
      </NodeToolbar>
    </div>
  )
})
