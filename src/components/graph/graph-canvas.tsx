"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import {
  ReactFlow,
  Controls,
  type NodeTypes,
  type Connection,
  MarkerType,
  ConnectionMode,
  type DefaultEdgeOptions,
  useReactFlow
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useGraphStore } from "@/stores/graph-store"
import { useNotificationStore } from "@/stores/notification-store"
import { useTimeStore } from "@/stores/time-store"
import { PersonNode } from "./person-node"
import { ClusterNode } from "./cluster-node"
import { AddEdgeLabelDialog } from "@/components/dialogs/add-edge-label"
import { OrganicEdge } from "./organic-edge"

const nodeTypes: NodeTypes = {
  person: PersonNode,
  cluster: ClusterNode,
}

const edgeTypes = {
  default: OrganicEdge,
}

// Increased contrast for edges so they are visible
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "default",
  style: { strokeWidth: 1.5, stroke: "rgba(255, 255, 255, 0.25)", zIndex: 0 },
  animated: true,
}

function DynamicBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background = `radial-gradient(800px circle at ${e.clientX}px ${e.clientY}px, rgba(255,255,255,0.06), transparent 50%)`
      }
    }
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
        ref={spotlightRef}
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at -1000px -1000px, rgba(255,255,255,0.06), transparent 50%)`
        }}
      />
    </div>
  )
}

export function GraphCanvas() {
  const nodes = useGraphStore(s => s.nodes)
  const edges = useGraphStore(s => s.edges)
  const selectedNodeId = useGraphStore(s => s.selectedNodeId)
  const onNodesChange = useGraphStore(s => s.onNodesChange)
  const onEdgesChange = useGraphStore(s => s.onEdgesChange)
  const selectNode = useGraphStore(s => s.selectNode)
  const autoLayout = useGraphStore(s => s.autoLayout)
  const onConnect = useGraphStore(s => s.onConnect)
  const syncGraph = useNotificationStore((s) => s.syncGraph)
  const now = useTimeStore((s) => s.now)
  const { fitView } = useReactFlow()

  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hasLaidOut, setHasLaidOut] = useState(false)

  // Use nodes.length to trigger on initial load/additions, now for edits/time passing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    syncGraph(nodes, now)
  }, [nodes.length, now, syncGraph])
  
  useEffect(() => {
    if (nodes.length > 0 && nodes.every(n => n.measured?.width)) {
      const needsLayout = nodes.some(n => n.position.x === 0 && n.position.y === 0 && !n.data?.manuallyPositioned)
      if (needsLayout) {
        if (!hasLaidOut) {
          setHasLaidOut(true)
          autoLayout()
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              fitView({ padding: 0.2, minZoom: 0.5, maxZoom: 1, duration: 400 })
            })
          })
        } else {
          // If already laid out but a new node appeared, just do a gentle local layout
          autoLayout({ localMode: true })
        }
      }
    }
  }, [nodes, hasLaidOut, autoLayout, fitView])

  const handleConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection)
  }, [])

  const focusId = hoveredNodeId || selectedNodeId

  const activeEdges = useMemo(() => {
    return edges.map((e) => {
      const isConnected = focusId && (e.source === focusId || e.target === focusId)
      const isFaded = focusId && !isConnected

      return {
        ...e,
        label: isFaded ? undefined : e.label,
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
        labelStyle: { 
          fill: isFaded ? "rgba(255, 255, 255, 0.15)" : isConnected ? "rgba(0, 200, 255, 0.9)" : "rgba(255, 255, 255, 0.6)", 
          fontSize: 10, 
          fontWeight: 500, 
          letterSpacing: "0.05em" 
        },
        labelBgStyle: { 
          fill: "#09090b", 
          fillOpacity: isFaded ? 0.4 : 0.9 
        },
      }
    })
  }, [edges, focusId])

  const activeNodes = useMemo(() => {
    if (!focusId) return nodes

    const connectedIds = new Set<string>()
    connectedIds.add(focusId)
    edges.forEach(e => {
      if (e.source === focusId) connectedIds.add(e.target)
      if (e.target === focusId) connectedIds.add(e.source)
    })

    return nodes.map((n) => {
      const isSelected = n.id === focusId || n.id === selectedNodeId
      const isConnected = connectedIds.has(n.id)
      
      return {
        ...n,
        style: {
          ...n.style,
          opacity: isSelected ? 1 : isConnected ? 0.85 : 0.25,
          transition: "opacity 0.3s ease",
        }
      }
    })
  }, [nodes, edges, focusId, selectedNodeId])

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
          onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onPaneClick={() => selectNode(null)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={["Backspace", "Delete"]}
          connectionMode={ConnectionMode.Loose}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} className="!bg-transparent !mb-12" />
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

