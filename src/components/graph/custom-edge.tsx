import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react'
import { useState, useEffect, useRef } from 'react'
import { useGraphStore } from '@/stores/graph-store'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  label
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const { deleteElements } = useReactFlow()
  const updateEdgeLabel = useGraphStore(s => s.updateEdgeLabel)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(label || ''))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(String(label || ''))
  }, [label])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ edges: [{ id }] })
  }

  const saveLabel = () => {
    setIsEditing(false)
    const val = editValue.trim()
    if (val && val !== label) {
      updateEdgeLabel(id, val)
    } else {
      setEditValue(String(label || ''))
    }
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : 1.5,
          stroke: selected ? '#3b82f6' : 'rgba(255,255,255,0.2)',
          transition: 'stroke 0.3s, stroke-width 0.3s',
          filter: selected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none',
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex flex-col items-center gap-1 z-50"
        >
          {/* Label Box */}
          <div 
            className={cn(
              "px-2 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider backdrop-blur-md transition-all duration-300 border",
              selected 
                ? "bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)] cursor-text" 
                : "bg-black/40 border-white/10 text-white/60 hover:bg-black/60 hover:text-white/80 cursor-pointer"
            )}
            onClick={(e) => {
              e.stopPropagation()
              if (!selected) return // let react flow select it first, or just allow immediate edit
              setIsEditing(true)
            }}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={saveLabel}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveLabel()
                  if (e.key === 'Escape') {
                    setEditValue(String(label || ''))
                    setIsEditing(false)
                  }
                }}
                className="bg-transparent border-none outline-none text-center w-24 text-blue-200 uppercase"
              />
            ) : (
              label || "Connected"
            )}
          </div>

          {/* Delete Button & Shortcuts (Only when selected) */}
          {selected && (
            <div 
              className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200 mt-1 cursor-pointer"
              onClick={handleDelete}
            >
              <div
                className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive/20 border border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors"
                title="Delete Edge"
              >
                <X size={10} strokeWidth={3} />
              </div>
              <div className="flex gap-1">
                <kbd className="h-4 px-1 rounded bg-white/10 border border-white/20 text-[8px] text-white/50 flex items-center font-mono uppercase">Del</kbd>
                <kbd className="h-4 px-1 rounded bg-white/10 border border-white/20 text-[8px] text-white/50 flex items-center font-mono">⌫</kbd>
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
