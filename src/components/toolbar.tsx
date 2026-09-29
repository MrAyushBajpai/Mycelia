"use client"

import { useState, useMemo } from "react"
import { Search, User, Users, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPersonDialog } from "@/components/dialogs/add-person"
import { AddClusterDialog } from "@/components/dialogs/add-cluster"
import { ImportCsvDialog } from "@/components/dialogs/import-csv"
import { useGraphStore } from "@/stores/graph-store"
import { useReactFlow } from "@xyflow/react"

export function Toolbar() {
  const [personOpen, setPersonOpen] = useState(false)
  const [clusterOpen, setClusterOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)

  const selectNode = useGraphStore(s => s.selectNode)
  const reactFlow = useReactFlow()

  // We only run the search logic dynamically when typing, fetching state to avoid subscription lag
  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const currentNodes = useGraphStore.getState().nodes
    return currentNodes.filter((n) => {
      const label = String((n.data as Record<string, unknown>).label).toLowerCase()
      return label.includes(q)
    })
  }, [query]) // we omit `nodes` so typing updates it, but drag does not!

  function focusNode(id: string) {
    const currentNodes = useGraphStore.getState().nodes
    const node = currentNodes.find((n) => n.id === id)
    if (!node) return
    selectNode(id)
    reactFlow.fitView({ nodes: [node], duration: 400, padding: 2 })
    setQuery("")
    setShowResults(false)
  }

  return (
    <>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2 items-center p-2 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 duration-700">
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/90" onClick={() => setPersonOpen(true)}>
          <User size={14} className="mr-1.5" />
          Add Person
        </Button>
        <div className="w-px h-4 bg-white/10" />
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/90" onClick={() => setClusterOpen(true)}>
          <Users size={14} className="mr-1.5" />
          Add Circle
        </Button>
        <div className="w-px h-4 bg-white/10" />
        <Button variant="ghost" size="icon-sm" className="rounded-full w-8 h-8 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center" onClick={() => setImportOpen(true)} title="Import CSV">
          <UploadCloud size={14} />
        </Button>

        <div className="w-px h-4 bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 h-8 rounded-full hover:bg-white/5 transition-colors">
            <Search size={14} className="text-white/50" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 150)}
              placeholder="Search..."
              className="bg-transparent text-sm text-white/90 outline-none w-36 placeholder:text-white/30"
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute bottom-12 left-0 w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1">
              {results.map((n) => (
                <button
                  key={n.id}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-white/10 rounded-lg flex items-center gap-2 text-white/80 transition-colors"
                  onMouseDown={() => focusNode(n.id)}
                >
                  {n.type === "cluster" ? <Users size={12} className="text-primary" /> : <User size={12} className="text-white/40" />}
                  {String((n.data as Record<string, unknown>).label)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {personOpen && <AddPersonDialog open={personOpen} onOpenChange={setPersonOpen} />}
      {clusterOpen && <AddClusterDialog open={clusterOpen} onOpenChange={setClusterOpen} />}
      {importOpen && <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} />}
    </>
  )
}
