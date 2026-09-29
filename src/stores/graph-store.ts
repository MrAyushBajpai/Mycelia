import { create } from "zustand"
import {
  type Node,
  type Edge,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react"

type GraphState = {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  selectNode: (id: string | null) => void
  deleteNode: (id: string) => void
  getConnections: (nodeId: string) => { edge: Edge; name: string }[]
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, id: `e-${Date.now()}` }, get().edges) })
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (id) => set({ selectedNodeId: id }),

  deleteNode: (id) => {
    const { nodes, edges, selectedNodeId } = get()
    set({
      nodes: nodes.filter((n) => n.id !== id),
      edges: edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
    })
  },
  
  getConnections: (nodeId) => {
    const { nodes, edges } = get()
    const connections = edges.filter((e) => e.source === nodeId || e.target === nodeId)
    return connections.map((e) => {
      const otherId = e.source === nodeId ? e.target : e.source
      const other = nodes.find((n) => n.id === otherId)
      return { edge: e, name: other ? String((other.data as Record<string, unknown>).label) : "?" }
    })
  },
}))
