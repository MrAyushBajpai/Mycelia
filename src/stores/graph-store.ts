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

  onConnect: async (connection) => {
    const supabase = (await import("@/lib/supabase/client")).createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find node types
    const sourceNode = get().nodes.find(n => n.id === connection.source)
    const targetNode = get().nodes.find(n => n.id === connection.target)

    const isContactCluster = sourceNode?.type === "person" && targetNode?.type === "cluster"
    const edgeId = isContactCluster ? `cc-${connection.source}-${connection.target}` : crypto.randomUUID()
    
    const newEdge = { ...connection, id: edgeId }
    set({ edges: addEdge(newEdge, get().edges) })

    // Insert to Supabase
    if (isContactCluster) {
      // It's a contact_cluster relationship
      await supabase.from("contact_clusters").insert({
        contact_id: connection.source,
        cluster_id: connection.target
      })
    } else {
      // It's a direct edge
      await supabase.from("edges").insert({
        id: edgeId,
        user_id: user.id,
        source_id: connection.source,
        target_id: connection.target,
        label: "Connected"
      })
    }
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (id) => set((state) => ({ 
    selectedNodeId: id,
    nodes: state.nodes.map(n => ({ ...n, selected: n.id === id }))
  })),

  deleteNode: async (id) => {
    const { nodes, edges, selectedNodeId } = get()
    const supabase = (await import("@/lib/supabase/client")).createClient()
    
    const nodeToDelete = nodes.find(n => n.id === id)
    const isEdge = !nodeToDelete && edges.some(e => e.id === id)

    set({
      nodes: nodes.filter((n) => n.id !== id),
      edges: edges.filter((e) => e.id !== id && e.source !== id && e.target !== id),
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
    })

    if (nodeToDelete?.type === "person") {
      await supabase.from("contacts").delete().eq("id", id)
    } else if (nodeToDelete?.type === "cluster") {
      await supabase.from("clusters").delete().eq("id", id)
    } else if (isEdge) {
      if (id.startsWith("cc-")) {
        // Implicit edge (contact_cluster)
        const parts = id.split("-")
        if (parts.length === 3) {
           await supabase.from("contact_clusters").delete().eq("contact_id", parts[1]).eq("cluster_id", parts[2])
        }
      } else {
        await supabase.from("edges").delete().eq("id", id)
      }
    }
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
