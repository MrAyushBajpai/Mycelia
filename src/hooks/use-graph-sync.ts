"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useGraphStore } from "@/stores/graph-store"
import { createClient } from "@/lib/supabase/client"
import { Node, Edge } from "@xyflow/react"

export function useGraphSync() {
  const supabase = createClient()
  const { setNodes, setEdges, nodes } = useGraphStore()
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchGraphData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [
      { data: contacts },
      { data: clusters },
      { data: dbEdges },
      { data: contactClusters }
    ] = await Promise.all([
      supabase.from("contacts").select("*"),
      supabase.from("clusters").select("*"),
      supabase.from("edges").select("*"),
      supabase.from("contact_clusters").select("*")
    ])

    if (!contacts || !clusters) {
      setLoading(false)
      return
    }

    const mappedNodes: Node[] = []

    clusters.forEach((c: any) => {
      mappedNodes.push({
        id: c.id,
        type: "cluster",
        position: { x: c.ui_x || 0, y: c.ui_y || 0 },
        data: { label: c.name, color: c.color, description: "" }
      })
    })

    contacts.forEach((c: any) => {
      mappedNodes.push({
        id: c.id,
        type: "person",
        position: { x: c.ui_x || 0, y: c.ui_y || 0 },
        data: { 
          label: c.name, 
          cadenceDays: c.cadence_days,
          lastContacted: c.last_contacted_at,
          customDates: c.custom_dates || {}
        }
      })
    })

    const mappedEdges: Edge[] = []
    
    // Edges between contacts
    if (dbEdges) {
      dbEdges.forEach((e: any) => {
        mappedEdges.push({
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          sourceHandle: e.source_handle,
          targetHandle: e.target_handle,
          label: e.label,
          animated: false
        })
      })
    }

    // Implicit edges from contact_clusters
    if (contactClusters) {
      contactClusters.forEach((cc: any) => {
        mappedEdges.push({
          id: `cc-${cc.contact_id}-${cc.cluster_id}`,
          source: cc.contact_id,
          target: cc.cluster_id,
          sourceHandle: cc.source_handle,
          targetHandle: cc.target_handle,
          animated: false
        })
      })
    }

    setNodes(mappedNodes)
    setEdges(mappedEdges)
    setLoading(false)
  }, [setNodes, setEdges, supabase])

  useEffect(() => {
    fetchGraphData()
  }, [fetchGraphData])

  // Debounced save positions
  const savePositions = useCallback((currentNodes: Node[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    
    saveTimeoutRef.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Only save nodes that have been manually dragged
      const contactsToUpdate = currentNodes.filter(n => n.type === "person" && n.data.manuallyPositioned).map(n => ({
        id: n.id,
        user_id: user.id,
        ui_x: Math.round(n.position.x),
        ui_y: Math.round(n.position.y)
      }))

      const clustersToUpdate = currentNodes.filter(n => n.type === "cluster" && n.data.manuallyPositioned).map(n => ({
        id: n.id,
        user_id: user.id,
        ui_x: Math.round(n.position.x),
        ui_y: Math.round(n.position.y)
      }))

      // We use upsert for simplicity, but strictly we are updating existing rows.
      // Upsert needs the required fields if inserting, but since the IDs exist it acts as an update.
      // Actually, standard update might be safer if not all fields are provided.
      // But Supabase allows patching multiple rows only if we use an array in upsert with onConflict.
      // Let's iterate and update because Supabase bulk update is weird without all columns.
      if (contactsToUpdate.length > 0) {
        Promise.all(contactsToUpdate.map(c => 
          supabase.from("contacts").update({ ui_x: c.ui_x, ui_y: c.ui_y }).eq("id", c.id)
        ))
      }
      
      if (clustersToUpdate.length > 0) {
        Promise.all(clustersToUpdate.map(c => 
          supabase.from("clusters").update({ ui_x: c.ui_x, ui_y: c.ui_y }).eq("id", c.id)
        ))
      }
    }, 1000)
  }, [supabase])

  useEffect(() => {
    if (nodes.length > 0 && !loading) {
      savePositions(nodes)
    }
  }, [nodes, loading, savePositions])

  return { loading, refetch: fetchGraphData }
}
