"use client"

import { useGraphStore } from "@/stores/graph-store"
import { useInteractionStore, Interaction } from "@/stores/interaction-store"
import { X, Edit2, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function CircleDetail() {
  const { nodes, edges, selectedNodeId, selectNode } = useGraphStore()
  
  // Real interactions from the store
  const { interactionsByContact } = useInteractionStore()
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  if (!selectedNode || selectedNode.type !== "cluster") return null
  
  const data = selectedNode.data as any
  const color = data.color || "#ffffff"
  
  // Find members of this circle
  const memberEdges = edges.filter(e => e.target === selectedNode.id)
  const members = memberEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean) as typeof nodes
  
  // Calculate recent activity from real interactions
  const allActivities = members.flatMap(m => {
    const contactInteractions = interactionsByContact[m.id] || []
    return contactInteractions.map((interaction: Interaction) => ({
      person: m,
      date: new Date(interaction.occurredAt).getTime(),
      action: interaction.note
    }))
  })
  
  // Sort activities by most recent first
  allActivities.sort((a, b) => b.date - a.date)
  
  return (
    <div className="fixed top-0 right-0 w-[360px] h-full bg-[#0a0a0c] border-l border-white/[0.04] shadow-2xl flex flex-col z-40 transform transition-transform duration-300">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              >
                {String(data.label).charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold text-white/90">{String(data.label)}</h2>
            </div>
            <button 
              onClick={() => selectNode(null)}
              className="p-2 -mr-2 text-white/40 hover:text-white/90 transition-colors rounded-full hover:bg-white/5"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-white/5 pb-px">
            <button className="text-sm font-medium text-[#ea580c] border-b-2 border-[#ea580c] pb-2 px-1">Overview</button>
            <button className="text-sm font-medium text-white/40 hover:text-white/70 pb-2 px-1">Members</button>
            <button className="text-sm font-medium text-white/40 hover:text-white/70 pb-2 px-1">Activity</button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-8">
          {/* Details */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Details</h3>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 text-[11px] transition-colors border border-white/5">
                <Edit2 size={10} /> Edit
              </button>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-[100px_1fr] items-start">
                <span className="text-white/40">Name</span>
                <span className="text-white/80">{String(data.label)}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start">
                <span className="text-white/40">Members</span>
                <span className="text-white/80">{members.length} people</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-start">
                <span className="text-white/40">Description</span>
                <span className="text-white/80 bg-white/[0.02] border border-white/[0.02] p-2.5 rounded-lg leading-relaxed text-[13px]">
                  {data.description || "No description provided."}
                </span>
              </div>
            </div>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Members ({members.length})</h3>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 text-[11px] transition-colors border border-white/5">
                <Plus size={10} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.slice(0, 5).map(m => (
                <div key={m.id} className="w-8 h-8 rounded-full bg-[#1c1c1e] border border-white/5 flex items-center justify-center text-white/80 font-medium text-xs shadow-sm" title={String(m.data.label)}>
                  {String(m.data.label).charAt(0).toUpperCase()}
                </div>
              ))}
              {members.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/50 font-medium text-[11px]">
                  +{members.length - 5}
                </div>
              )}
              {members.length === 0 && <span className="text-white/40 text-sm">No members yet.</span>}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-sm font-semibold text-white/90 mb-4">Recent Activity</h3>
            <div className="flex flex-col gap-4">
              {allActivities.length > 0 ? allActivities.slice(0, 5).map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1c1c1e] border border-white/5 flex items-center justify-center flex-shrink-0 text-white/80 font-medium text-xs shadow-sm mt-0.5">
                    {String(act.person.data.label).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-white/90 truncate">{String(act.person.data.label)}</span>
                      <span className="text-[11px] text-white/30 whitespace-nowrap flex-shrink-0">
                        {formatDistanceToNow(act.date)} ago
                      </span>
                    </div>
                    <div className="text-[13px] text-white/60 line-clamp-2 leading-snug">{act.action}</div>
                  </div>
                </div>
              )) : (
                <div className="text-white/40 text-sm">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
