"use client"

import { useEffect, useState } from "react"
import { GraphCanvas } from "@/components/graph/graph-canvas"
import { ContactDetail } from "@/components/panels/contact-detail"
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
    <main className="relative flex-1">
      <GraphCanvas />
      <ContactDetail />
    </main>
  )
}
