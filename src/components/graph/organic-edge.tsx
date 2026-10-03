import { memo } from "react"
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useStore, type EdgeProps } from "@xyflow/react"

export const OrganicEdge = memo(function OrganicEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
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
  // Hide label if edge is faded (from graph-canvas passing opacity in style)
  const isFaded = style?.stroke === "rgba(255, 255, 255, 0.05)"
  const showLabel = label && !isFaded
  const labelScale = Math.max(1, 0.8 / zoom)

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className="absolute nodrag nopan pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) scale(${labelScale})`,
              background: "#09090b",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.05em",
              padding: "4px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              zIndex: 5 // Below nodes which are z-10
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})
