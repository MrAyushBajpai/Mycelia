"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@clerk/nextjs"
import { useGraphStore } from "@/stores/graph-store"
import { useInteractionStore } from "@/stores/interaction-store"
import { createAuthenticatedClient } from "@/lib/supabase/client"
import { Node, Edge } from "@xyflow/react"

export function useGraphSync() {
  const { userId, getToken } = useAuth()
  const { setNodes, setEdges, nodes } = useGraphStore()
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<Record<string, {x: number, y: number}>>({})

  const fetchGraphData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)

    const supabase = await createAuthenticatedClient(() => getToken({ template: "supabase" }))

    const [
      { data: contacts },
      { data: clusters },
      { data: dbEdges },
      { data: contactClusters },
      { data: interactions }
    ] = await Promise.all([
      supabase.from("contacts").select("*"),
      supabase.from("clusters").select("*"),
      supabase.from("edges").select("*"),
      supabase.from("contact_clusters").select("*"),
      supabase.from("interactions").select("*")
    ])

    if (!contacts || !clusters) {
      setLoading(false)
      return
    }

    if (interactions) {
      useInteractionStore.getState().setInteractions(interactions)
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
          email: c.email || null,
          phone: c.phone || null,
          notes: c.notes || null,
          avatarUrl: c.avatar_url || null,
          cadenceDays: c.cadence_days,
          lastContacted: c.last_contacted_at,
          customDates: c.custom_dates || {}
        }
      })
    })

    const mappedEdges: Edge[] = []
    
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

    if (contactClusters) {
      contactClusters.forEach((cc: any) => {
        mappedEdges.push({
          id: `cc-${cc.contact_id}-${cc.cluster_id}`,
          source: cc.contact_id,
          target: cc.cluster_id,
          sourceHandle: cc.source_handle,
          targetHandle: cc.target_handle,
          label: cc.label || undefined,
          animated: false
        })
      })
    }

    setNodes(mappedNodes)
    setEdges(mappedEdges)
    
    const initialPositions: Record<string, {x: number, y: number}> = {}
    mappedNodes.forEach(n => {
      initialPositions[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) }
    })
    lastSavedRef.current = initialPositions

    setLoading(false)
  }, [userId, getToken, setNodes, setEdges])

  useEffect(() => {
    fetchGraphData()
  }, [fetchGraphData])

  const savePositions = useCallback((currentNodes: Node[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!userId) return

      const supabase = await createAuthenticatedClient(() => getToken({ template: "supabase" }))

      const contactsToUpdate: any[] = []
      const clustersToUpdate: any[] = []

      currentNodes.forEach(n => {
        const x = Math.round(n.position.x)
        const y = Math.round(n.position.y)
        const last = lastSavedRef.current[n.id]
        
        if (!last || last.x !== x || last.y !== y) {
          lastSavedRef.current[n.id] = { x, y }
          
          const payload = { id: n.id, user_id: userId, ui_x: x, ui_y: y }
          if (n.type === "person") contactsToUpdate.push(payload)
          else if (n.type === "cluster") clustersToUpdate.push(payload)
        }
      })

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
  }, [userId, getToken])

  useEffect(() => {
    if (nodes.length > 0 && !loading) {
      savePositions(nodes)
    }
  }, [nodes, loading, savePositions])

  return { loading, refetch: fetchGraphData }
}
