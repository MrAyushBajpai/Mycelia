"use client"

import { useEffect, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { GraphCanvas } from "@/components/graph/graph-canvas"
import { ContactDetail } from "@/components/panels/contact-detail"
import { Toolbar } from "@/components/toolbar"
import { CommandBar } from "@/components/command-bar"
import { useGraphStore } from "@/stores/graph-store"

const SEED_NODES = [
  { id: "c-family", type: "cluster", position: { x: 1000, y: 300 }, data: { label: "Family", color: "#ef4444" } },
  { id: "c-work", type: "cluster", position: { x: 1000, y: 0 }, data: { label: "Design Team", color: "#3b82f6" } },
  { id: "c-college", type: "cluster", position: { x: 1000, y: 600 }, data: { label: "College", color: "#10b981" } },
  { id: "p-mom", type: "person", position: { x: 200, y: 200 }, data: { label: "Mom", cadenceDays: 7, lastContacted: new Date(Date.now() - 3 * 86400000).toISOString() } },
  { id: "p-dad", type: "person", position: { x: 200, y: 400 }, data: { label: "Dad" } },
  { id: "p-alex", type: "person", position: { x: 600, y: 0 }, data: { label: "Alex", cadenceDays: 14, lastContacted: new Date(Date.now() - 15 * 86400000).toISOString(), nextActionReason: "Project check-in" } },
  { id: "p-sarah", type: "person", position: { x: 600, y: 300 }, data: { label: "Sarah", cadenceDays: 30 } },
  { id: "p-jordan", type: "person", position: { x: 600, y: 600 }, data: { label: "Jordan", customDates: { "Birthday": new Date().toISOString() } } },
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
        {/* Branding */}
        <div className="absolute top-5 left-6 z-40 flex items-center gap-2.5 select-none">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white/50 tracking-wider">MYCELIA</span>
        </div>
        <Toolbar />
        <CommandBar />
        <GraphCanvas />
        <ContactDetail />
      </main>
    </ReactFlowProvider>
  )
}
