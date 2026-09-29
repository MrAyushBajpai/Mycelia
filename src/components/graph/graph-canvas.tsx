"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
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
import { useNotificationStore } from "@/stores/notification-store"
import { useTimeStore } from "@/stores/time-store"
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
  labelStyle: { fill: "rgba(255, 255, 255, 0.6)", fontSize: 10, fontWeight: 500, letterSpacing: "0.05em" },
  labelBgStyle: { fill: "#09090b", fillOpacity: 0.9 },
  labelBgPadding: [6, 4],
  labelBgBorderRadius: 4,
  animated: true,
}

function DynamicBackground() {
  const [mouse, setMouse] = useState({ x: -1000, y: -1000 })

  useEffect(() => {
    const handleMove = (e: PointerEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener("pointermove", handleMove)
    return () => window.removeEventListener("pointermove", handleMove)
  }, [])

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
    </div>
  )
}

export function GraphCanvas() {
  const { nodes, edges, selectedNodeId, onNodesChange, onEdgesChange, selectNode } = useGraphStore()
  const syncGraph = useNotificationStore((s) => s.syncGraph)
  const now = useTimeStore((s) => s.now)

  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)

  useEffect(() => {
    syncGraph(nodes, now)
  }, [nodes, now, syncGraph])

  const handleConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection)
  }, [])

  const activeEdges = useMemo(() => {
    return edges.map((e) => {
      const isConnected = selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId)
      const isFaded = selectedNodeId && !isConnected

      return {
        ...e,
        animated: isConnected ? true : false,
        style: {
          ...e.style,
          strokeWidth: isConnected ? 2 : 1.5,
          stroke: isConnected 
            ? "rgba(0, 200, 255, 0.4)" 
            : isFaded 
              ? "rgba(255, 255, 255, 0.05)" 
              : "rgba(255, 255, 255, 0.25)",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: isConnected 
            ? "rgba(0, 200, 255, 0.4)" 
            : isFaded 
              ? "rgba(255, 255, 255, 0.05)" 
              : "rgba(255, 255, 255, 0.4)",
        }
      }
    })
  }, [edges, selectedNodeId])

  const activeNodes = useMemo(() => {
    if (!selectedNodeId) return nodes

    const connectedIds = new Set<string>()
    connectedIds.add(selectedNodeId)
    edges.forEach(e => {
      if (e.source === selectedNodeId) connectedIds.add(e.target)
      if (e.target === selectedNodeId) connectedIds.add(e.source)
    })

    return nodes.map((n) => {
      const isSelected = n.id === selectedNodeId
      const isConnected = connectedIds.has(n.id)
      
      return {
        ...n,
        style: {
          ...n.style,
          opacity: isSelected ? 1 : isConnected ? 0.85 : 0.4,
          transition: "opacity 0.3s ease",
        }
      }
    })
  }, [nodes, edges, selectedNodeId])

  return (
    <div className="h-screen w-full relative">
      <DynamicBackground />
      <div className="absolute inset-0 z-10">
        <ReactFlow
          nodes={activeNodes}
          edges={activeEdges}
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
