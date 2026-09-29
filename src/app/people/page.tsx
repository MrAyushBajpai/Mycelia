"use client"

import { useEffect, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { useGraphStore } from "@/stores/graph-store"
import { SearchBar } from "@/components/search-bar"
import { Sidebar } from "@/components/sidebar"
import { ContactDetail } from "@/components/panels/contact-detail"
import { SEED_NODES, SEED_EDGES } from "@/lib/seed-data"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Filter, ArrowUpDown } from "lucide-react"
import { AddPersonDialog } from "@/components/dialogs/add-person"
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns"

export default function PeoplePage() {
  const { nodes, edges, setNodes, setEdges, selectNode, selectedNodeId } = useGraphStore()
  const [mounted, setMounted] = useState(false)
  const [addPersonOpen, setAddPersonOpen] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    if (nodes.length === 0) {
      setNodes(SEED_NODES)
      setEdges(SEED_EDGES)
    }
    setMounted(true)
  }, [nodes.length, setNodes, setEdges])

  if (!mounted) return null

  const people = nodes.filter(n => n.type === "person")
  const circles = nodes.filter(n => n.type === "cluster")

  const filteredPeople = filter 
    ? people.filter(p => edges.some(e => e.source === p.id && e.target === filter))
    : people

  return (
    <ReactFlowProvider>
      <main className="relative flex-1 bg-[#050505] min-h-screen pl-[260px] flex flex-col">
        <Sidebar />
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

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilter(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!filter ? "bg-[#0d9488]/20 text-[#2dd4bf] border border-[#0d9488]/30" : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"}`}
              >
                All ({people.length})
              </button>
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
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-lg h-9 gap-2">
                <Filter size={14} /> Filter
              </Button>
              <Button variant="outline" className="bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-lg h-9 gap-2">
                <ArrowUpDown size={14} /> Sort
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
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
              {filteredPeople.map(person => {
                const isSelected = selectedNodeId === person.id
                
                // Edges where person is source and target is another person
                const personConnections = edges.filter(e => e.source === person.id && nodes.find(n => n.id === e.target)?.type === "person")
                // Edges where person is source and target is a cluster
                const circleConnections = edges.filter(e => e.source === person.id && nodes.find(n => n.id === e.target)?.type === "cluster")

                const data = person.data as any
                const lastContact = data.lastContacted ? new Date(data.lastContacted) : null
                const lastContactStr = lastContact ? formatDistanceToNow(lastContact, { addSuffix: true }) : "Never"
                
                let nextFollowUpStr = "-"
                let isOverdue = false
                if (lastContact && data.cadenceDays) {
                  const nextDate = new Date(lastContact.getTime() + data.cadenceDays * 86400000)
                  if (isPast(nextDate)) {
                    isOverdue = true
                    nextFollowUpStr = `Overdue by ${differenceInDays(new Date(), nextDate)} days`
                  } else {
                    nextFollowUpStr = `In ${formatDistanceToNow(nextDate)}`
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
                      {personConnections.map(c => (
                        <span key={c.id} className="px-2 py-0.5 rounded-md bg-white/5 text-white/50 text-[11px] border border-white/5">
                          {c.label}
                        </span>
                      ))}
                      {personConnections.length === 0 && <span className="text-white/20">-</span>}
                    </div>

                    <div className="text-white/60">
                      {lastContactStr}
                    </div>

                    <div className={`font-medium ${isOverdue ? "text-[#ea580c]" : "text-white/60"}`}>
                      {nextFollowUpStr}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {circleConnections.map(c => {
                        const target = nodes.find(n => n.id === c.target)
                        if (!target) return null
                        const color = (target.data as any).color || "#ffffff"
                        return (
                          <span key={c.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-white/80 text-[11px] border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            {String((target.data as any).label)}
                          </span>
                        )
                      })}
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
              
              {filteredPeople.length === 0 && (
                <div className="p-12 text-center text-white/40">
                  No people found in this group.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ReactFlowProvider>
  )
}
