import { memo, useMemo } from "react"
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useInternalNode, useStore, Position, type EdgeProps } from "@xyflow/react"

function getBezierPoint(t: number, sx: number, sy: number, tx: number, ty: number, posS: Position, posT: Position) {
  // simplified control points from react-flow
  const dx = Math.abs(tx - sx)
  const dy = Math.abs(ty - sy)
  const cDist = Math.max(dx, dy) * 0.5
  
  let c1x = sx, c1y = sy
  if (posS === Position.Left) c1x -= cDist
  else if (posS === Position.Right) c1x += cDist
  else if (posS === Position.Top) c1y -= cDist
  else if (posS === Position.Bottom) c1y += cDist

  let c2x = tx, c2y = ty
  if (posT === Position.Left) c2x -= cDist
  else if (posT === Position.Right) c2x += cDist
  else if (posT === Position.Top) c2y -= cDist
  else if (posT === Position.Bottom) c2y += cDist

  const mt = 1 - t
  const x = mt*mt*mt*sx + 3*mt*mt*t*c1x + 3*mt*t*t*c2x + t*t*t*tx
  const y = mt*mt*mt*sy + 3*mt*mt*t*c1y + 3*mt*t*t*c2y + t*t*t*ty
  return [x, y]
}

export const OrganicEdge = memo(function OrganicEdge({
  id,
  source,
  target,
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
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const allNodes = useStore(s => s.nodeLookup)

  const [path, labelX, labelY, hidden] = useMemo(() => {
    let sx = sourceX
    let sy = sourceY
    let tx = targetX
    let ty = targetY
    let sPos = sourcePosition
    let tPos = targetPosition

    if (sourceNode && targetNode) {
      const sX = sourceNode.internals.positionAbsolute.x
      const sY = sourceNode.internals.positionAbsolute.y
      const sW = sourceNode.measured?.width || 120
      const sH = sourceNode.measured?.height || 50

      const tX = targetNode.internals.positionAbsolute.x
      const tY = targetNode.internals.positionAbsolute.y
      const tW = targetNode.measured?.width || 120
      const tH = targetNode.measured?.height || 50

      if (tX < sX) {
        const isAbove = tY + tH / 2 < sY + sH / 2
        sPos = isAbove ? Position.Top : Position.Bottom
        tPos = isAbove ? Position.Bottom : Position.Top
        sx = sX + sW / 2
        sy = sY + (isAbove ? 0 : sH)
        tx = tX + tW / 2
        ty = tY + (isAbove ? tH : 0)
      }
    }

    const [dPath] = getBezierPath({ sourceX: sx, sourceY: sy, sourcePosition: sPos, targetX: tx, targetY: ty, targetPosition: tPos })

    let finalLx = 0, finalLy = 0, isHidden = false
    if (label) {
      const ts = [0.5, 0.4, 0.6, 0.3, 0.7]
      let found = false
      for (const t of ts) {
        const [px, py] = getBezierPoint(t, sx, sy, tx, ty, sPos, tPos)
        
        let collision = false
        // Check collision against all nodes
        for (const [_, n] of allNodes.entries()) {
          const nx = n.internals.positionAbsolute.x
          const ny = n.internals.positionAbsolute.y
          const nw = n.measured?.width || 120
          const nh = n.measured?.height || 50
          
          // label is ~ 60x20, plus 8px padding
          if (px > nx - 38 && px < nx + nw + 38 && py > ny - 18 && py < ny + nh + 18) {
            collision = true
            break
          }
        }
        
        if (!collision) {
          finalLx = px
          finalLy = py
          found = true
          break
        }
      }
      
      if (!found) {
        // If all collide, default to center but mark hidden
        const [px, py] = getBezierPoint(0.5, sx, sy, tx, ty, sPos, tPos)
        finalLx = px
        finalLy = py
        isHidden = true
      }
    }

    return [dPath, finalLx, finalLy, isHidden]
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, sourceNode, targetNode, allNodes, label])

  const isFaded = style?.opacity === 0.05
  const showLabel = label && !isFaded && (!hidden || style?.opacity === 1) // If fully opaque (hovered), show even if hidden

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className="absolute nodrag nopan pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
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
