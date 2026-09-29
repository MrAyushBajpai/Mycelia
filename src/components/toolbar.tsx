"use client"

import { useState, useMemo } from "react"
import { Search, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPersonDialog } from "@/components/dialogs/add-person"
import { AddClusterDialog } from "@/components/dialogs/add-cluster"
import { useGraphStore } from "@/stores/graph-store"
import { useReactFlow } from "@xyflow/react"

export function Toolbar() {
  const [personOpen, setPersonOpen] = useState(false)
  const [clusterOpen, setClusterOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)

  const { nodes, selectNode } = useGraphStore()
  const reactFlow = useReactFlow()

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return nodes.filter((n) => {
      const label = String((n.data as Record<string, unknown>).label).toLowerCase()
      return label.includes(q)
    })
  }, [query, nodes])

  function focusNode(id: string) {
    const node = nodes.find((n) => n.id === id)
    if (!node) return
    selectNode(id)
    reactFlow.fitView({ nodes: [node], duration: 400, padding: 2 })
    setQuery("")
    setShowResults(false)
  }

  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex gap-2 items-start">
        <Button variant="outline" size="sm" onClick={() => setPersonOpen(true)}>
          <User size={14} data-icon="inline-start" />
          Add Person
        </Button>
        <Button variant="outline" size="sm" onClick={() => setClusterOpen(true)}>
          <Users size={14} data-icon="inline-start" />
          Add Circle
        </Button>

        <div className="relative">
          <div className="flex items-center gap-1.5 bg-card border rounded-md px-2.5 h-8">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              placeholder="Search..."
              className="bg-transparent text-sm outline-none w-36"
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute top-9 left-0 w-full bg-card border rounded-md shadow-md overflow-hidden">
              {results.map((n) => (
                <button
                  key={n.id}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                  onMouseDown={() => focusNode(n.id)}
                >
                  {n.type === "cluster" ? <Users size={12} /> : <User size={12} />}
                  {String((n.data as Record<string, unknown>).label)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddPersonDialog open={personOpen} onOpenChange={setPersonOpen} />
      <AddClusterDialog open={clusterOpen} onOpenChange={setClusterOpen} />
    </>
  )
}
