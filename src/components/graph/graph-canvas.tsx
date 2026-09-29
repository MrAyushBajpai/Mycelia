"use client"

import { useState, useCallback, useEffect } from "react"
import {
  ReactFlow,
  Controls,
  type NodeTypes,
  type Connection,
  MarkerType,
  type DefaultEdgeOptions,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useGraphStore } from "@/stores/graph-store"
import { PersonNode } from "./person-node"
import { ClusterNode } from "./cluster-node"
import { AddEdgeLabelDialog } from "@/components/dialogs/add-edge-label"

const nodeTypes: NodeTypes = {
  person: PersonNode,
  cluster: ClusterNode,
}

// Increased contrast for edges so they are visible
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "rgba(255, 255, 255, 0.4)" },
  style: { strokeWidth: 1.5, stroke: "rgba(255, 255, 255, 0.25)" },
  animated: true,
}

function DynamicBackground() {
  const [mouse, setMouse] = useState({ x: -1000, y: -1000 })
  const [trail, setTrail] = useState({ x: -1000, y: -1000 })

  useEffect(() => {
    const handleMove = (e: PointerEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener("pointermove", handleMove)
    return () => window.removeEventListener("pointermove", handleMove)
  }, [])

  useEffect(() => {
    let frameId: number
    const loop = () => {
      setTrail((prev) => ({
        x: prev.x + (mouse.x - prev.x) * 0.15,
        y: prev.y + (mouse.y - prev.y) * 0.15,
      }))
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [mouse])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 bg-[#09090b] overflow-hidden">
      {/* Clean minimal grid */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Broad spotlight */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,0.06), transparent 50%)`
        }}
      />
      {/* Cyan trail */}
      <div 
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: `radial-gradient(150px circle at ${trail.x}px ${trail.y}px, rgba(0,240,255,0.15), transparent 70%)`
        }}
      />
    </div>
  )
}

export function GraphCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, selectNode } = useGraphStore()
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)

  const handleConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection)
  }, [])

  return (
    <div className="h-screen w-full relative">
      <DynamicBackground />
      <div className="absolute inset-0 z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={(_, node) => selectNode(node.id)}
          onPaneClick={() => selectNode(null)}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={["Backspace", "Delete"]}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} className="!bg-transparent" />
        </ReactFlow>
      </div>

      <AddEdgeLabelDialog
        open={!!pendingConnection}
        connection={pendingConnection}
        onOpenChange={(open) => { if (!open) setPendingConnection(null) }}
      />
    </div>
  )
}
