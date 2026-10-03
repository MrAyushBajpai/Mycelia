import { memo, useState, useRef, useEffect } from "react"
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useStore, useReactFlow, type EdgeProps } from "@xyflow/react"
import { useGraphStore } from "@/stores/graph-store"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const OrganicEdge = memo(function OrganicEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  selected,
}: EdgeProps) {
  
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const zoom = useStore(s => s.transform[2])
  const isFaded = style?.stroke === "rgba(255, 255, 255, 0.05)"
  const labelScale = Math.max(1, 0.8 / zoom)

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
        path={path} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : (style?.strokeWidth || 1.5),
          stroke: selected ? '#3b82f6' : (style?.stroke || 'rgba(255,255,255,0.2)'),
          transition: 'stroke 0.3s, stroke-width 0.3s',
          filter: selected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none',
        }} 
      />
      
      {(!isFaded || selected) && (
        <EdgeLabelRenderer>
          <div
            className="absolute nodrag nopan z-50 flex flex-col items-center gap-1"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(${labelScale})`,
              pointerEvents: 'all',
            }}
          >
            <div 
              className={cn(
                "px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-[0.05em] backdrop-blur-md transition-all duration-300 border",
                selected 
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)] cursor-text" 
                  : "bg-[#09090b] border-white/5 text-white/60 hover:bg-black/60 hover:text-white/80 cursor-pointer"
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (selected) setIsEditing(true)
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
                  className="bg-transparent border-none outline-none text-center min-w-[60px] text-blue-200 uppercase tracking-[0.05em] font-medium"
                />
              ) : (
                label || "Connected"
              )}
            </div>

            {selected && (
              <div 
                className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200 mt-0.5 cursor-pointer"
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
                  <kbd className="h-4 px-1 rounded bg-white/10 border border-white/20 text-[8px] text-white/50 flex items-center font-mono">&#x232B;</kbd>
                </div>
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})

