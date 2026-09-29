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
  autoLayout: (options?: { resetPins?: boolean; localMode?: boolean }) => void
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    let nextNodes = applyNodeChanges(changes, get().nodes)
    
    // Mark nodes as manually positioned if the user drags them
    const draggedNodeIds = new Set(
      changes
        .filter((c): c is import("@xyflow/react").NodePositionChange => c.type === 'position' && !!c.dragging)
        .map(c => c.id)
    )
    if (draggedNodeIds.size > 0) {
      nextNodes = nextNodes.map(n => 
        draggedNodeIds.has(n.id) 
          ? { ...n, data: { ...n.data, manuallyPositioned: true } }
          : n
      )
    }
    
    const currentSelectedId = get().selectedNodeId
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

  autoLayout: async (options) => {
    const { computeLayout } = await import('@/lib/layout')
    const { nodes, edges } = get()
    const layoutedNodes = computeLayout(nodes, edges, options)
    const posMap = new Map(layoutedNodes.map(n => [n.id, n.position]))
    
    set({
      nodes: nodes.map(n => {
        const pos = posMap.get(n.id)
        if (pos) {
          return {
            ...n,
            position: { x: pos.x, y: pos.y },
            data: {
              ...n.data,
              manuallyPositioned: options?.resetPins ? false : n.data.manuallyPositioned
            }
          }
        }
        return n
      })
    })
  }
}))
