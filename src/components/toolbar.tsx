"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, User, Users, UploadCloud, MessageSquare, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPersonDialog } from "@/components/dialogs/add-person"
import { AddClusterDialog } from "@/components/dialogs/add-cluster"
import { ImportCsvDialog } from "@/components/dialogs/import-csv"
import { NotificationMenu } from "@/components/notification-menu"
import { useGraphStore } from "@/stores/graph-store"
import { useReactFlow } from "@xyflow/react"

export function Toolbar() {
  const [personOpen, setPersonOpen] = useState(false)
  const [clusterOpen, setClusterOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectNode = useGraphStore(s => s.selectNode)
  const reactFlow = useReactFlow()

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", handleGlobalKey)
    return () => document.removeEventListener("keydown", handleGlobalKey)
  }, [])

  // Derive categorized results dynamically when typing
  const categorizedResults = useMemo(() => {
    if (!query.trim()) return { people: [], clusters: [], edges: [], all: [] }
    const q = query.toLowerCase()
    const { nodes, edges } = useGraphStore.getState()
    
    const people = nodes.filter(n => n.type === "person" && String((n.data as any).label).toLowerCase().includes(q))
    const clusters = nodes.filter(n => n.type === "cluster" && String((n.data as any).label).toLowerCase().includes(q))
    
    const matchedEdges = edges.filter(e => e.label && String(e.label).toLowerCase().includes(q)).map(e => {
      const source = nodes.find(n => n.id === e.source)
      const target = nodes.find(n => n.id === e.target)
      return {
        ...e,
        sourceLabel: source ? String((source.data as any).label) : "Unknown",
        targetLabel: target ? String((target.data as any).label) : "Unknown"
      }
    })

    const all = [
      ...people.map(p => ({ ...p, _group: "people" })),
      ...clusters.map(c => ({ ...c, _group: "clusters" })),
      ...matchedEdges.map(e => ({ ...e, _group: "edges" }))
    ]

    return { people, clusters, edges: matchedEdges, all }
  }, [query])

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function executeSearchAction(item: any) {
    if (!item) return
    let targetNodeId = item.id
    if (item._group === "edges") {
      targetNodeId = item.source // focus the source person of the relationship
    }

    const currentNodes = useGraphStore.getState().nodes
    const node = currentNodes.find(n => n.id === targetNodeId)
    if (!node) return

    selectNode(targetNodeId)
    reactFlow.fitView({ nodes: [node], duration: 400, padding: 2 })
    setQuery("")
    setShowResults(false)
    searchInputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showResults) return
    
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, categorizedResults.all.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      executeSearchAction(categorizedResults.all[selectedIndex])
    } else if (e.key === "Escape") {
      e.preventDefault()
      setQuery("")
      setShowResults(false)
      searchInputRef.current?.blur()
    }
  }

  return (
    <>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-1 items-center p-1.5 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] animate-in slide-in-from-bottom-5 duration-700">
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/90" onClick={() => setPersonOpen(true)} title="Add a new person">
          <User size={14} className="mr-1.5" />
          Add Person
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/90" onClick={() => setClusterOpen(true)} title="Add a new circle/group">
          <Users size={14} className="mr-1.5" />
          Add Circle
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <Button variant="ghost" size="icon-sm" className="rounded-full w-8 h-8 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center" onClick={() => setImportOpen(true)} title="Import CSV">
          <UploadCloud size={14} />
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/70 hover:text-white gap-1.5" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))} title="Log interaction (⌘K)">
          <MessageSquare size={14} />
          <span className="text-white/90">Log</span>
          <kbd className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 font-mono ml-1">⌘K</kbd>
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <NotificationMenu />
        <div className="w-px h-5 bg-white/[0.06]" />
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 h-8 rounded-full hover:bg-white/5 transition-colors focus-within:bg-white/5 focus-within:ring-1 focus-within:ring-white/20">
            <Search size={14} className="text-white/50" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="bg-transparent text-sm text-white/90 outline-none w-48 placeholder:text-white/30"
            />
            <kbd className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono hidden sm:block">⌘/</kbd>
          </div>
          
          {showResults && categorizedResults.all.length > 0 && (
            <div className="absolute bottom-12 left-0 w-80 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-2 flex flex-col gap-1 max-h-[350px] overflow-y-auto">
              {categorizedResults.people.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-white/40 uppercase">People</div>
                  {categorizedResults.people.map(p => {
                    const idx = categorizedResults.all.findIndex(item => item.id === p.id && item._group === "people")
                    const isSelected = selectedIndex === idx
                    return (
                      <button
                        key={`p-${p.id}`}
                        className={`w-full px-2 py-1.5 text-[14px] font-medium text-left rounded-lg flex items-center gap-2 transition-colors ${isSelected ? "bg-primary/20 text-white" : "text-white/80 hover:bg-white/5"}`}
                        onMouseDown={() => executeSearchAction({ ...p, _group: "people" })}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <User size={14} className={isSelected ? "text-primary" : "text-white/40"} />
                        {String((p.data as any).label)}
                      </button>
                    )
                  })}
                </div>
              )}
              
              {categorizedResults.clusters.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-white/40 uppercase">Circles</div>
                  {categorizedResults.clusters.map(c => {
                    const idx = categorizedResults.all.findIndex(item => item.id === c.id && item._group === "clusters")
                    const isSelected = selectedIndex === idx
                    return (
                      <button
                        key={`c-${c.id}`}
                        className={`w-full px-2 py-1.5 text-[12px] font-medium uppercase tracking-[0.1em] text-left rounded-lg flex items-center gap-2 transition-colors ${isSelected ? "bg-primary/20 text-white" : "text-white/80 hover:bg-white/5"}`}
                        onMouseDown={() => executeSearchAction({ ...c, _group: "clusters" })}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <Users size={14} className={isSelected ? "text-primary" : "text-white/40"} />
                        {String((c.data as any).label)}
                      </button>
                    )
                  })}
                </div>
              )}

              {categorizedResults.edges.length > 0 && (
                <div className="mb-1">
                  <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-white/40 uppercase">Relationships</div>
                  {categorizedResults.edges.map(e => {
                    const idx = categorizedResults.all.findIndex(item => item.id === e.id && item._group === "edges")
                    const isSelected = selectedIndex === idx
                    return (
                      <button
                        key={`e-${e.id}`}
                        className={`w-full px-2 py-1.5 text-left rounded-lg flex items-center gap-1.5 transition-colors ${isSelected ? "bg-primary/20 text-white" : "text-white/80 hover:bg-white/5"}`}
                        onMouseDown={() => executeSearchAction({ ...e, _group: "edges" })}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className="text-[14px] font-medium">{e.sourceLabel}</span>
                        <ArrowRight size={12} className="text-white/30 mx-0.5" />
                        <span className={`text-[11px] font-medium uppercase tracking-[0.08em] ${isSelected ? "text-primary" : "text-white/50"}`}>{String(e.label)}</span>
                        <ArrowRight size={12} className="text-white/30 mx-0.5" />
                        <span className="text-[14px] font-medium">{e.targetLabel}</span>
                      </button>
                    )
                  })}
                </div>
              )}
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
