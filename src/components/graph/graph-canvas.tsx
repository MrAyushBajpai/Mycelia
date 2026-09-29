"use client"

import {
  ReactFlow,
  Background,
  Controls,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useGraphStore } from "@/stores/graph-store"
import { PersonNode } from "./person-node"
import { ClusterNode } from "./cluster-node"

const nodeTypes: NodeTypes = {
  person: PersonNode,
  cluster: ClusterNode,
}

export function GraphCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, selectNode } = useGraphStore()

  return (
    <div className="h-screen w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
