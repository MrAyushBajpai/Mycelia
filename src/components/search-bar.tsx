"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, User, Users, ArrowRight } from "lucide-react"
import { useGraphStore } from "@/stores/graph-store"
import { useReactFlow } from "@xyflow/react"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectNode = useGraphStore(s => s.selectNode)
  const reactFlow = useReactFlow()

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      const activeTag = document.activeElement?.tagName
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA"

      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setIsExpanded(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      } else if (!isTyping) {
        if (e.key === "/") {
          e.preventDefault()
          setIsExpanded(true)
          setTimeout(() => searchInputRef.current?.focus(), 50)
        }
      }
    }
    document.addEventListener("keydown", handleGlobalKey)
    return () => document.removeEventListener("keydown", handleGlobalKey)
  }, [])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function executeSearchAction(item: any) {
    if (!item) return
    let targetNodeId = item.id
    if (item._group === "edges") {
      targetNodeId = item.source
    }

    const currentNodes = useGraphStore.getState().nodes
    const node = currentNodes.find(n => n.id === targetNodeId)
    if (!node) return

    selectNode(targetNodeId)
    reactFlow.fitView({ nodes: [node], duration: 400, padding: 2 })
    setQuery("")
    setShowResults(false)
    setIsExpanded(false)
    searchInputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (showResults) setSelectedIndex(prev => Math.min(prev + 1, categorizedResults.all.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (showResults) setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (showResults && categorizedResults.all.length > 0) {
        executeSearchAction(categorizedResults.all[selectedIndex])
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setQuery("")
      setShowResults(false)
      setIsExpanded(false)
      searchInputRef.current?.blur()
    }
  }

  const isActuallyExpanded = isExpanded || query.length > 0

  return (
    <div 
      ref={containerRef}
      className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (document.activeElement !== searchInputRef.current && !query) {
          setIsExpanded(false)
        }
      }}
    >
      <div 
        className={`flex items-center h-10 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] rounded-full transition-all duration-300 ease-out overflow-hidden cursor-text ${isActuallyExpanded ? "w-80 px-1" : "w-10 px-0 justify-center"}`}
        onClick={() => {
          setIsExpanded(true)
          searchInputRef.current?.focus()
        }}
      >
        <div className={`flex items-center justify-center text-white/50 transition-all duration-300 flex-shrink-0 ${isActuallyExpanded ? "w-8 ml-2" : "w-10"}`}>
          <Search size={14} />
        </div>
        
        <input
          ref={searchInputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
          onFocus={() => { setIsExpanded(true); setShowResults(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className={`bg-transparent text-sm text-white/90 outline-none placeholder:text-white/30 h-full flex-1 transition-all duration-300 ${isActuallyExpanded ? "opacity-100 ml-1" : "opacity-0 w-0"}`}
          tabIndex={isActuallyExpanded ? 0 : -1}
        />

        {isActuallyExpanded && (
          <kbd className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono mr-3 flex-shrink-0">⌘/</kbd>
        )}
      </div>
      
      {showResults && categorizedResults.all.length > 0 && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-2 flex flex-col gap-1 max-h-[350px] overflow-y-auto mt-2">
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
  )
}
