"use client"

import { useEffect, useState, useMemo } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { useGraphStore } from "@/stores/graph-store"
import { SearchBar } from "@/components/search-bar"
import { ContactDetail } from "@/components/panels/contact-detail"
import { SEED_NODES, SEED_EDGES } from "@/lib/seed-data"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, ArrowUpDown, Clock, AlertCircle, Type } from "lucide-react"
import { AddPersonDialog } from "@/components/dialogs/add-person"
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns"

type SortOption = 'urgency' | 'recent' | 'alpha'

export default function PeoplePage() {
  const { nodes, edges, setNodes, setEdges, selectNode, selectedNodeId } = useGraphStore()
  const [mounted, setMounted] = useState(false)
  const [addPersonOpen, setAddPersonOpen] = useState(false)
  const [filter, setFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("urgency")

  useEffect(() => {
    if (nodes.length === 0) {
      setNodes(SEED_NODES)
      setEdges(SEED_EDGES)
    }
    setMounted(true)
  }, [nodes.length, setNodes, setEdges])

  const people = useMemo(() => nodes.filter(n => n.type === "person"), [nodes])
  const circles = useMemo(() => nodes.filter(n => n.type === "cluster"), [nodes])

  // Performance: Precompute sort/filter values once per render cycle
  const computedPeople = useMemo(() => {
    const now = Date.now()
    return people.map(p => {
      const data = p.data as any
      const lastContact = data.lastContacted ? new Date(data.lastContacted).getTime() : 0
      const nextDate = (lastContact && data.cadenceDays) 
        ? lastContact + (data.cadenceDays * 86400000) 
        : Infinity
      const isOverdue = nextDate !== Infinity && nextDate < now
      
      return { 
        ...p, 
        lastContact, 
        nextDate, 
        isOverdue, 
        label: String(data.label || "") 
      }
    })
  }, [people])

  const sortedAndFiltered = useMemo(() => {
    // 1. Filter
    let result = computedPeople
    if (filter === "overdue") {
      result = result.filter(p => p.isOverdue)
    } else if (filter !== "all") {
      result = result.filter(p => edges.some(e => e.source === p.id && e.target === filter))
    }

    // 2. Sort
    return [...result].sort((a, b) => {
      if (sortBy === "alpha") return a.label.localeCompare(b.label)
      if (sortBy === "recent") return b.lastContact - a.lastContact
      if (sortBy === "urgency") return a.nextDate - b.nextDate
      return 0
    })
  }, [computedPeople, edges, filter, sortBy])

  const overdueCount = computedPeople.filter(p => p.isOverdue).length

  if (!mounted) return null

  return (
    <ReactFlowProvider>
      <main className="relative flex-1 bg-[#050505] min-h-screen flex flex-col">
        <SearchBar />
        <ContactDetail />
        {addPersonOpen && <AddPersonDialog open={addPersonOpen} onOpenChange={setAddPersonOpen} />}

        <div className="flex-1 p-10 max-w-6xl mx-auto w-full pt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-white/90 tracking-tight mb-2">People</h1>
              <p className="text-white/40 text-sm">Your network at a glance. Manage relationships, track context, and never miss a follow-up.</p>
            </div>
            <Button 
              onClick={() => setAddPersonOpen(true)}
              className="bg-white text-black hover:bg-white/90 rounded-full px-5 h-10 gap-2 font-medium"
            >
              <Plus size={16} />
              Add Person
            </Button>
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilter("all")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-[#0d9488]/20 text-[#2dd4bf] border border-[#0d9488]/30" : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"}`}
              >
                All ({people.length})
              </button>
              
              <button 
                onClick={() => setFilter("overdue")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${filter === "overdue" ? "bg-[#ea580c]/20 text-[#ea580c] border border-[#ea580c]/30" : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"}`}
              >
                Needs Action {overdueCount > 0 && <span className="bg-[#ea580c] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{overdueCount}</span>}
              </button>

              <div className="w-px h-6 bg-white/10 mx-1 self-center" />

              {circles.map(c => {
                const count = edges.filter(e => e.target === c.id).length
                const isActive = filter === c.id
                return (
                  <button 
                    key={c.id}
                    onClick={() => setFilter(c.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? "bg-[#0d9488]/20 text-[#2dd4bf] border border-[#0d9488]/30" : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"}`}
                  >
                    {String((c.data as any).label)} ({count})
                  </button>
                )
              })}
            </div>
            
            <div className="flex items-center relative group">
              <Button variant="outline" className="bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-lg h-9 gap-2">
                <ArrowUpDown size={14} /> 
                {sortBy === "urgency" && "Sort: Urgency"}
                {sortBy === "recent" && "Sort: Recent Interaction"}
                {sortBy === "alpha" && "Sort: A-Z"}
              </Button>
              
              {/* Sort Dropdown */}
              <div className="absolute right-0 top-10 w-48 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 py-1">
                <div 
                  className={`px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors ${sortBy === "urgency" ? "text-primary bg-primary/10" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                  onClick={() => setSortBy("urgency")}
                >
                  <AlertCircle size={14} /> By Urgency
                </div>
                <div 
                  className={`px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors ${sortBy === "recent" ? "text-primary bg-primary/10" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                  onClick={() => setSortBy("recent")}
                >
                  <Clock size={14} /> Recent Interaction
                </div>
                <div 
                  className={`px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors ${sortBy === "alpha" ? "text-primary bg-primary/10" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                  onClick={() => setSortBy("alpha")}
                >
                  <Type size={14} /> Alphabetical
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl pb-4">
            <div className="grid grid-cols-[auto_1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 p-4 border-b border-white/5 text-xs font-semibold tracking-wider text-white/40 uppercase items-center">
              <div className="w-5"></div>
              <div>Name</div>
              <div>Connections</div>
              <div>Last Interaction</div>
              <div>Next Follow-up</div>
              <div>Groups</div>
              <div className="w-8"></div>
            </div>

            <div className="flex flex-col">
              {sortedAndFiltered.map(person => {
                const isSelected = selectedNodeId === person.id
                
                // Edges where person is source and target is another person
                const personConnections = edges.filter(e => e.source === person.id && nodes.find(n => n.id === e.target)?.type === "person")
                // Edges where person is source and target is a cluster
                const circleConnections = edges.filter(e => e.source === person.id && nodes.find(n => n.id === e.target)?.type === "cluster")

                const data = person.data as any
                const lastContactStr = person.lastContact > 0 ? formatDistanceToNow(person.lastContact, { addSuffix: true }) : "Never"
                
                let nextFollowUpStr = "-"
                if (person.lastContact > 0 && data.cadenceDays) {
                  if (person.isOverdue) {
                    nextFollowUpStr = `Overdue by ${differenceInDays(new Date(), person.nextDate)} days`
                  } else {
                    nextFollowUpStr = `In ${formatDistanceToNow(person.nextDate)}`
                  }
                }

                return (
                  <div 
                    key={person.id}
                    onClick={() => selectNode(person.id)}
                    className={`grid grid-cols-[auto_1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 p-4 items-center text-sm border-b border-white/[0.02] last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-[#ea580c]/[0.02]" : "hover:bg-white/[0.02]"}`}
                    style={isSelected ? { outline: '1px solid rgba(234,88,12,0.3)', outlineOffset: '-1px' } : {}}
                  >
                    <div className="w-5 flex justify-center">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-[#ea580c] border-[#ea580c]" : "border-white/20"}`}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white/90 font-medium text-xs">
                        {String(data.label).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white/90">{String(data.label)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {personConnections.slice(0, 2).map(c => (
                        <span key={c.id} className="px-2 py-0.5 rounded-md bg-white/5 text-white/50 text-[11px] border border-white/5 whitespace-nowrap">
                          {c.label}
                        </span>
                      ))}
                      {personConnections.length > 2 && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[11px] border border-white/5 whitespace-nowrap">
                          +{personConnections.length - 2}
                        </span>
                      )}
                      {personConnections.length === 0 && <span className="text-white/20">-</span>}
                    </div>

                    <div className="text-white/60 truncate">
                      {lastContactStr}
                    </div>

                    <div className={`font-medium truncate ${person.isOverdue ? "text-[#ea580c]" : "text-white/60"}`}>
                      {nextFollowUpStr}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {circleConnections.slice(0, 2).map(c => {
                        const target = nodes.find(n => n.id === c.target)
                        if (!target) return null
                        const color = (target.data as any).color || "#ffffff"
                        return (
                          <span key={c.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-white/80 text-[11px] border border-white/5 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate max-w-[100px]">{String((target.data as any).label)}</span>
                          </span>
                        )
                      })}
                      {circleConnections.length > 2 && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 text-[11px] border border-white/5 whitespace-nowrap">
                          +{circleConnections.length - 2}
                        </span>
                      )}
                      {circleConnections.length === 0 && <span className="text-white/20">-</span>}
                    </div>

                    <div className="w-8 flex justify-center relative group">
                      <button 
                        className="text-white/20 hover:text-white/80 transition-colors p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          // The menu toggle would go here
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {/* Simple Dropdown Menu Mockup */}
                      <div className="absolute right-0 top-6 w-48 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                        <div className="px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()}>Mute notifications</div>
                        <div className="px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()}>Archive contact</div>
                        <div className="h-px bg-white/10 my-1"></div>
                        <div className="px-3 py-1.5 text-xs text-red-500/80 hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()}>Delete person</div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {sortedAndFiltered.length === 0 && (
                <div className="p-12 text-center text-white/40">
                  No people found in this view.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ReactFlowProvider>
  )
}
