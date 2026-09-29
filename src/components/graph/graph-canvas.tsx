"use client"

import { useState, useCallback } from "react"
import {
  ReactFlow,
  Background,
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

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "rgba(255, 255, 255, 0.15)" },
  style: { strokeWidth: 1, stroke: "rgba(255, 255, 255, 0.08)" },
  animated: true,
}

export function GraphCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, selectNode } = useGraphStore()
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)

  const handleConnect = useCallback((connection: Connection) => {
    setPendingConnection(connection)
  }, [])

  return (
    <div className="h-screen w-full">
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
        <Background gap={32} size={1} color="rgba(255, 255, 255, 0.04)" />
        <Controls showInteractive={false} className="!bg-transparent" />
      </ReactFlow>

      <AddEdgeLabelDialog
        open={!!pendingConnection}
        connection={pendingConnection}
        onOpenChange={(open) => { if (!open) setPendingConnection(null) }}
      />
    </div>
  )
}
