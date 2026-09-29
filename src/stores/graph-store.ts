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
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    const nextNodes = applyNodeChanges(changes, get().nodes)
    const currentSelectedId = get().selectedNodeId
    
    // If we have a selection, but React Flow natively deselected it (e.g. via Esc)
    if (currentSelectedId) {
      const activeNode = nextNodes.find(n => n.id === currentSelectedId)
      if (activeNode && activeNode.selected === false) {
        set({ nodes: nextNodes, selectedNodeId: null })
        return
      }
    }
    
    set({ nodes: nextNodes })
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, id: `e-${Date.now()}` }, get().edges) })
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (id) => set((state) => ({ 
    selectedNodeId: id,
    nodes: state.nodes.map(n => ({ ...n, selected: n.id === id }))
  })),

  deleteNode: (id) => {
    const { nodes, edges, selectedNodeId } = get()
    set({
      nodes: nodes.filter((n) => n.id !== id),
      edges: edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
    })
  },
}))
