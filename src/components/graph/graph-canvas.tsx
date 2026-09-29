"use client"

import {
  ReactFlow,
  Background,
  Controls,
  type NodeTypes,
  MarkerType,
  type DefaultEdgeOptions,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useGraphStore } from "@/stores/graph-store"
import { PersonNode } from "./person-node"
import { ClusterNode } from "./cluster-node"

const nodeTypes: NodeTypes = {
  person: PersonNode,
  cluster: ClusterNode,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  style: { strokeWidth: 1.5 },
}

export function GraphCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } = useGraphStore()

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
