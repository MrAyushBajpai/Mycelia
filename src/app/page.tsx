"use client"

import { useEffect, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { GraphCanvas } from "@/components/graph/graph-canvas"
import { ContactDetail } from "@/components/panels/contact-detail"
import { Toolbar } from "@/components/toolbar"
import { CommandBar } from "@/components/command-bar"
import { useGraphStore } from "@/stores/graph-store"
import { SearchBar } from "@/components/search-bar"
import { Sidebar } from "@/components/sidebar"

const SEED_NODES = [
  { id: "c-family", type: "cluster", position: { x: 0, y: 0 }, data: { label: "Family", color: "#ef4444" } },
  { id: "c-work", type: "cluster", position: { x: 0, y: 0 }, data: { label: "Design Team", color: "#3b82f6" } },
  { id: "c-college", type: "cluster", position: { x: 0, y: 0 }, data: { label: "College", color: "#10b981" } },
  { id: "p-mom", type: "person", position: { x: 0, y: 0 }, data: { label: "Mom", cadenceDays: 7, lastContacted: new Date(Date.now() - 3 * 86400000).toISOString() } },
  { id: "p-dad", type: "person", position: { x: 0, y: 0 }, data: { label: "Dad" } },
  { id: "p-alex", type: "person", position: { x: 0, y: 0 }, data: { label: "Alex", cadenceDays: 14, lastContacted: new Date(Date.now() - 15 * 86400000).toISOString(), nextActionReason: "Project check-in" } },
  { id: "p-sarah", type: "person", position: { x: 0, y: 0 }, data: { label: "Sarah", cadenceDays: 30 } },
  { id: "p-jordan", type: "person", position: { x: 0, y: 0 }, data: { label: "Jordan", customDates: { "Birthday": new Date().toISOString() } } },
]

const SEED_EDGES = [
  // People belonging to contexts (Person -> Circle)
  { id: "e-1", source: "p-mom", target: "c-family", label: "Mother", animated: false },
  { id: "e-2", source: "p-dad", target: "c-family", label: "Father", animated: false },
  { id: "e-3", source: "p-alex", target: "c-work", label: "Manager", animated: false },
  { id: "e-4", source: "p-sarah", target: "c-work", label: "Peer", animated: false },
  { id: "e-5", source: "p-jordan", target: "c-college", label: "Alumni", animated: false },
  { id: "e-6", source: "p-sarah", target: "c-college", label: "Alumni", animated: false },
  
  // Direct person-to-person relationships
  { id: "e-7", source: "p-alex", target: "p-sarah", label: "Mentors", animated: false },
]

export default function Home() {
  const { setNodes, setEdges } = useGraphStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setNodes(SEED_NODES)
    setEdges(SEED_EDGES)
    setMounted(true)
  }, [setNodes, setEdges])

  if (!mounted) return null

  return (
    <ReactFlowProvider>
      <main className="relative flex-1">
        <Sidebar />
        <SearchBar />
        <Toolbar />
        <CommandBar />
        <GraphCanvas />
        <ContactDetail />
      </main>
    </ReactFlowProvider>
  )
}
