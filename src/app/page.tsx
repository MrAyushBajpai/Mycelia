"use client"

import { useEffect, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { GraphCanvas } from "@/components/graph/graph-canvas"
import { ContactDetail } from "@/components/panels/contact-detail"
import { Toolbar } from "@/components/toolbar"
import { CommandBar } from "@/components/command-bar"
import { SearchBar } from "@/components/search-bar"
import { CircleDetail } from "@/components/panels/circle-detail"
import { useGraphSync } from "@/hooks/use-graph-sync"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <ReactFlowProvider>
      <main className="relative flex-1">
        <SearchBar />
        <Toolbar />
        <CommandBar />
        <GraphCanvas />
        <ContactDetail />
        <CircleDetail />
      </main>
    </ReactFlowProvider>
  )
}
