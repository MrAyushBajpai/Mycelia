"use client"

import { useEffect, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { GraphCanvas } from "@/components/graph/graph-canvas"
import { ContactDetail } from "@/components/panels/contact-detail"
import { Toolbar } from "@/components/toolbar"
import { CommandBar } from "@/components/command-bar"
import { useGraphStore } from "@/stores/graph-store"

const SEED_NODES = [
  { id: "c-family", type: "cluster", position: { x: 0, y: 150 }, data: { label: "Family", color: "#ef4444" } },
  { id: "c-work", type: "cluster", position: { x: 500, y: 0 }, data: { label: "Work", color: "#3b82f6" } },
  { id: "c-college", type: "cluster", position: { x: 500, y: 300 }, data: { label: "College", color: "#10b981" } },
  { id: "p-1", type: "person", position: { x: 200, y: 100 }, data: { label: "Mom" } },
  { id: "p-2", type: "person", position: { x: 200, y: 220 }, data: { label: "Dad" } },
  { id: "p-3", type: "person", position: { x: 350, y: 50 }, data: { label: "Alex" } },
  { id: "p-4", type: "person", position: { x: 350, y: 160 }, data: { label: "Sarah" } },
  { id: "p-5", type: "person", position: { x: 350, y: 280 }, data: { label: "Jordan" } },
]

const SEED_EDGES = [
  { id: "e-1", source: "c-family", target: "p-1", animated: false },
  { id: "e-2", source: "c-family", target: "p-2", animated: false },
  { id: "e-3", source: "p-3", target: "c-work", animated: false },
  { id: "e-4", source: "p-4", target: "c-work", animated: false },
  { id: "e-5", source: "p-5", target: "c-college", animated: false },
  { id: "e-6", source: "p-4", target: "c-college", animated: false },
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
        <div className="absolute top-5 left-6 z-10 flex items-center gap-2.5 select-none">
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
