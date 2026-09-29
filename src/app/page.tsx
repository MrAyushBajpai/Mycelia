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
import { SEED_NODES, SEED_EDGES } from "@/lib/seed-data"

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
