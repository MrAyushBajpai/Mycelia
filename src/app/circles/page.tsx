"use client"

import { useEffect, useState, useMemo } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { useGraphStore } from "@/stores/graph-store"
import { SearchBar } from "@/components/search-bar"
import { CircleDetail } from "@/components/panels/circle-detail"
import { SEED_NODES, SEED_EDGES } from "@/lib/seed-data"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, ArrowUpDown, Clock, Type, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type SortOption = 'recent' | 'alpha' | 'members'

export default function CirclesPage() {
  const { nodes, edges, setNodes, setEdges, selectNode, selectedNodeId } = useGraphStore()
  const [mounted, setMounted] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("recent")

  useEffect(() => {
    setMounted(true)
  }, [])

  const circles = useMemo(() => nodes.filter(n => n.type === "cluster"), [nodes])

  // Performance: Precompute metrics for circles (members, last activity)
  const computedCircles = useMemo(() => {
    return circles.map(c => {
      const data = c.data as any
      // Find members connected to this circle
      const memberEdges = edges.filter(e => e.target === c.id)
      const members = memberEdges.map(e => nodes.find(n => n.id === e.source && n.type === "person")).filter(Boolean)
      
      // Calculate last activity based on members' lastContacted
      let lastActivity = 0
      members.forEach(m => {
        const mData = m!.data as any
        if (mData.lastContacted) {
          const time = new Date(mData.lastContacted).getTime()
          if (time > lastActivity) lastActivity = time
        }
      })

      return {
        ...c,
        members,
        memberCount: members.length,
        lastActivity,
        label: String(data.label || ""),
        description: String(data.description || ""),
        color: data.color || "#ffffff"
      }
    })
  }, [circles, edges, nodes])

  const sortedCircles = useMemo(() => {
    return [...computedCircles].sort((a, b) => {
      if (sortBy === "alpha") return a.label.localeCompare(b.label)
      if (sortBy === "recent") return b.lastActivity - a.lastActivity
      if (sortBy === "members") return b.memberCount - a.memberCount
      return 0
    })
  }, [computedCircles, sortBy])

  if (!mounted) return null

  return (
    <ReactFlowProvider>
      <main className="relative flex-1 bg-[#050505] min-h-screen flex flex-col">
        <SearchBar />
        <CircleDetail />

        <div className="flex-1 p-10 max-w-5xl mx-auto w-full pt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-white/90 tracking-tight mb-2">Circles</h1>
              <p className="text-white/40 text-sm">Organize your network into circles. Keep track of the people, purpose, and activity.</p>
            </div>
            <Button 
              className="bg-white text-black hover:bg-white/90 rounded-full px-5 h-10 gap-2 font-medium"
            >
              <Plus size={16} />
              Add Circle
            </Button>
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-[#0d9488]/20 text-[#2dd4bf] border border-[#0d9488]/30">
                All ({circles.length})
              </button>
            </div>
            
            <div className="flex items-center relative group">
              <Button variant="outline" className="bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-lg h-9 gap-2">
                <ArrowUpDown size={14} /> 
                {sortBy === "recent" && "Sort: Recent Activity"}
                {sortBy === "members" && "Sort: Most Members"}
                {sortBy === "alpha" && "Sort: A-Z"}
              </Button>
              
              {/* Sort Dropdown */}
              <div className="absolute right-0 top-10 w-48 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 py-1">
                <div 
                  className={`px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors ${sortBy === "recent" ? "text-primary bg-primary/10" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                  onClick={() => setSortBy("recent")}
                >
                  <Clock size={14} /> Recent Activity
                </div>
                <div 
                  className={`px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors ${sortBy === "members" ? "text-primary bg-primary/10" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                  onClick={() => setSortBy("members")}
                >
                  <Users size={14} /> Most Members
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
            <div className="grid grid-cols-[auto_1.5fr_1.5fr_1.5fr_auto] gap-4 p-4 border-b border-white/5 text-xs font-semibold tracking-wider text-white/40 uppercase items-center">
              <div className="w-5"></div>
              <div>Circle Name</div>
              <div>Members</div>
              <div>Last Activity</div>
              <div className="w-8"></div>
            </div>

            <div className="flex flex-col">
              {sortedCircles.map(circle => {
                const isSelected = selectedNodeId === circle.id
                const lastActivityStr = circle.lastActivity > 0 ? formatDistanceToNow(circle.lastActivity, { addSuffix: true }) : "Never"
                
                return (
                  <div 
                    key={circle.id}
                    onClick={() => selectNode(circle.id)}
                    className={`grid grid-cols-[auto_1.5fr_1.5fr_1.5fr_auto] gap-4 p-4 items-center text-sm border-b border-white/[0.02] last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-[#ea580c]/[0.02]" : "hover:bg-white/[0.02]"}`}
                    style={isSelected ? { outline: '1px solid rgba(234,88,12,0.3)', outlineOffset: '-1px' } : {}}
                  >
                    <div className="w-5 flex justify-center">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-[#ea580c] border-[#ea580c]" : "border-white/20"}`}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium text-xs shadow-sm"
                        style={{ backgroundColor: circle.color }}
                      >
                        {circle.label.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white/90">{circle.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {circle.members.slice(0, 3).map((m: any) => (
                          <div 
                            key={m.id} 
                            className="w-6 h-6 rounded-full bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-[10px] font-medium text-white/80"
                            title={String(m.data.label)}
                          >
                            {String(m.data.label).charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <span className="text-white/60 text-xs">
                        {circle.memberCount > 3 ? `+${circle.memberCount - 3}` : (circle.memberCount === 0 ? "0 members" : "")}
                      </span>
                    </div>

                    <div className="text-white/60 truncate">
                      {lastActivityStr}
                    </div>

                    <div className="w-8 flex justify-center relative group">
                      <button 
                        className="text-white/20 hover:text-white/80 transition-colors p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {/* Simple Dropdown Menu Mockup */}
                      <div className="absolute right-0 top-6 w-48 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                        <div className="px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()}>Edit details</div>
                        <div className="px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()}>Add members</div>
                        <div className="h-px bg-white/10 my-1"></div>
                        <div className="px-3 py-1.5 text-xs text-red-500/80 hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()}>Delete circle</div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {sortedCircles.length === 0 && (
                <div className="p-12 text-center text-white/40">
                  No circles found. Create one to organize your network.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ReactFlowProvider>
  )
}
