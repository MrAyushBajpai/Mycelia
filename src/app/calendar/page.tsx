"use client"

import { useState, useMemo, useEffect } from "react"
import { useGraphStore } from "@/stores/graph-store"
import { SearchBar } from "@/components/search-bar"
import { ReactFlowProvider } from "@xyflow/react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, addDays, subDays, differenceInDays } from "date-fns"

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false)
  const { nodes, edges } = useGraphStore()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<"Month" | "Week" | "List">("Month")
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const events = useMemo(() => {
    const evts: any[] = []
    
    nodes.forEach(node => {
      if (node.type === "person") {
        const data = node.data as any
        
        // Find if they are in a cluster to inherit color if no explicit color is set
        const clusterEdge = edges.find(e => e.source === node.id)
        let clusterColor = "#3b82f6" // fallback blue
        if (clusterEdge) {
          const cluster = nodes.find(n => n.id === clusterEdge.target)
          if (cluster && (cluster.data as any).color) clusterColor = (cluster.data as any).color
        }

        if (data.customDates) {
          Object.entries(data.customDates).forEach(([title, dateStr]) => {
            const date = new Date(dateStr as string)
            date.setFullYear(new Date().getFullYear())
            
            const lowerTitle = title.toLowerCase()
            let eventColor = clusterColor // fallback to circle color for unknown events
            if (lowerTitle.includes("birthday")) eventColor = "#8b5cf6"
            else if (lowerTitle.includes("anniversary")) eventColor = "#ef4444"
            else if (lowerTitle.includes("sync") || lowerTitle.includes("call")) eventColor = "#f97316"
            
            evts.push({
              id: `${node.id}-${title}`,
              date,
              title: `${data.label}'s ${title.toLowerCase()}`,
              color: eventColor,
              type: title,
              people: [node],
              time: null
            })
          })
        }
        
        if (data.cadenceDays && data.lastContacted) {
          const lastContact = new Date(data.lastContacted)
          const nextContact = addDays(lastContact, data.cadenceDays)
          
          evts.push({
            id: `${node.id}-reminder`,
            date: nextContact,
            title: data.nextActionReason || `${data.label} - check in`,
            color: data.nextActionReason ? "#f97316" : clusterColor,
            type: "Reminder",
            people: [node],
            time: "10:00 AM - 11:00 AM"
          })
        }
      }
    })
    
    return evts.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [nodes, edges])
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) })
  
  const displayDays = view === "Week" ? weekDays : calendarDays
  
  const selectedEvents = events.filter(e => isSameDay(e.date, selectedDate))
  
  const today = new Date()
  const upcomingEvents = events.filter(e => {
    const diff = differenceInDays(e.date, today)
    return diff >= -7 && diff <= 30
  }).slice(0, 5) // Show top 5 near events

  const nextPeriod = () => setCurrentDate(view === "Week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1))
  const prevPeriod = () => setCurrentDate(view === "Week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1))
  
  const headerFormat = view === "Week" 
    ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`
    : format(currentDate, "MMMM yyyy")

  if (!mounted) return null

  return (
    <ReactFlowProvider>
      <main className="relative flex-1 bg-[#050505] min-h-screen flex">
        {/* Left Side - Calendar Grid */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
          <SearchBar />
          
          <div className="flex-1 p-10 pt-24 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-semibold text-white/90 tracking-tight mb-2">Calendar</h1>
                <p className="text-white/40 text-sm">Stay on top of important dates. Birthdays, anniversaries, and reminders to connect with the people in your network.</p>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  {/* View Toggle */}
                  <div className="flex items-center bg-[#0a0a0c] border border-white/5 rounded-full p-1">
                    {["Month", "Week", "List"].map(v => (
                      <button 
                        key={v}
                        onClick={() => setView(v as any)}
                        className={`px-4 py-1.5 text-sm rounded-full transition-colors ${view === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center gap-4">
                    <button onClick={prevPeriod} className="w-8 h-8 rounded-full bg-[#0a0a0c] border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-white/90 font-medium min-w-[150px] text-center">{headerFormat}</span>
                    <button onClick={nextPeriod} className="w-8 h-8 rounded-full bg-[#0a0a0c] border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0c] border border-white/5 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div>
                    All Events <ChevronDown size={14} />
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0c] border border-white/5 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Circles <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* View Content */}
              {view !== "List" ? (
                <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                  {/* Days of Week */}
                  <div className="grid grid-cols-7 border-b border-white/5">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                      <div key={day} className="py-3 text-center text-xs font-semibold tracking-wider text-white/40 uppercase">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Dates */}
                  <div className={`grid grid-cols-7 ${view === "Week" ? "flex-1 min-h-[400px]" : ""}`}>
                    {displayDays.map((day, idx) => {
                      const isCurrentMonth = isSameMonth(day, currentDate)
                      const isSelected = isSameDay(day, selectedDate)
                      const dayEvents = events.filter(e => isSameDay(e.date, day))
                      
                      return (
                        <div 
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`min-h-[120px] p-2 border-r border-b border-white/5 cursor-pointer transition-colors ${
                            (!isCurrentMonth && view === "Month") ? "bg-[#050505]/50 text-white/20" : "hover:bg-white/[0.02]"
                          } ${isSelected ? "ring-1 ring-inset ring-[#3b82f6]/50 bg-[#3b82f6]/[0.02]" : ""}`}
                        >
                          <div className={`text-sm font-medium mb-1 ${isToday(day) ? "text-[#3b82f6]" : ((isCurrentMonth || view === "Week") ? "text-white/60" : "text-white/20")}`}>
                            {format(day, "d")}
                          </div>
                          <div className="flex flex-col gap-1 mt-2">
                            {dayEvents.map(e => (
                              <div 
                                key={e.id} 
                                className="px-2 py-1 rounded-md text-[11px] font-medium truncate flex items-center gap-1.5 border border-white/5 transition-opacity hover:opacity-80"
                                style={{ backgroundColor: `${e.color}15`, color: e.color }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }}></div>
                                <span className="truncate">{e.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col p-6 gap-6">
                  {(() => {
                    const monthEvents = events.filter(e => e.date >= monthStart && e.date <= monthEnd);
                    if (monthEvents.length === 0) return <div className="text-white/40 text-sm text-center py-10">No events this month.</div>
                    
                    // Group by date
                    const groups: Record<string, typeof monthEvents> = {};
                    monthEvents.forEach(e => {
                      const d = format(e.date, "yyyy-MM-dd");
                      if (!groups[d]) groups[d] = [];
                      groups[d].push(e);
                    });
                    
                    return Object.entries(groups).map(([dateStr, dateEvents]) => {
                      const dateObj = new Date(dateStr);
                      return (
                        <div key={dateStr} className="flex gap-6">
                          <div className="w-16 flex-shrink-0 text-right">
                            <div className="text-xs font-semibold tracking-wider text-white/40 uppercase">{format(dateObj, "EEE")}</div>
                            <div className={`text-xl font-medium ${isToday(dateObj) ? "text-[#3b82f6]" : "text-white/90"}`}>{format(dateObj, "d")}</div>
                          </div>
                          <div className="flex-1 flex flex-col gap-3 pt-1 border-l border-white/5 pl-6 pb-6">
                            {dateEvents.map(e => (
                              <div key={e.id} onClick={() => setSelectedDate(e.date)} className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group cursor-pointer hover:bg-white/[0.04] transition-colors">
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: e.color }}></div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }}></div>
                                    <h4 className="font-medium text-white/90">{e.title}</h4>
                                  </div>
                                  <div className="text-xs text-white/40 pl-4">{e.type}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Selected Day & Upcoming */}
        <div className="w-[360px] bg-[#0a0a0c] flex flex-col flex-shrink-0 z-10 pt-24 h-screen border-t-0">
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Selected Date Header */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="text-white/40 hover:text-white/90 transition-colors p-1"><ChevronLeft size={18} /></button>
              <h2 className="text-lg font-semibold text-white/90">{format(selectedDate, "EEE, MMM d, yyyy")}</h2>
              <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="text-white/40 hover:text-white/90 transition-colors p-1"><ChevronRight size={18} /></button>
            </div>
            
            {/* Selected Events */}
            <div className="flex flex-col gap-3 mb-10">
              {selectedEvents.length > 0 ? selectedEvents.map(e => (
                <div key={e.id} className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group cursor-pointer hover:bg-white/[0.04] transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: e.color }}></div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }}></div>
                        <h4 className="font-medium text-white/90">{e.title}</h4>
                      </div>
                      {e.time && <div className="text-xs text-white/40 pl-4">{e.time}</div>}
                    </div>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors mt-1" />
                  </div>
                  
                  {e.people && e.people.length > 0 && (
                    <div className="flex -space-x-2 pl-4 mt-1">
                      {e.people.map((p: any) => (
                        <div key={p.id} className="w-6 h-6 rounded-full bg-[#1c1c1e] border border-white/10 flex items-center justify-center text-[10px] font-medium text-white/80">
                          {String(p.data.label).charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-10 text-white/40 text-sm border border-white/5 rounded-xl bg-white/[0.02]">
                  No events scheduled
                </div>
              )}
            </div>

            {/* Upcoming Dates */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">People with upcoming dates</h3>
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all</button>
            </div>
            
            <div className="flex flex-col gap-4">
              {upcomingEvents.map(e => {
                const p = e.people[0] as any
                const days = differenceInDays(e.date, today)
                let relativeStr = days === 0 ? "Today" : days < 0 ? `${Math.abs(days)} days ago` : `In ${days} days`
                
                return (
                  <div key={e.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1c1c1e] border border-white/5 flex items-center justify-center flex-shrink-0 text-white/80 font-medium text-xs shadow-sm relative">
                        {String(p.data.label).charAt(0).toUpperCase()}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0a0a0c]" style={{ backgroundColor: e.color }}></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/90">{p.data.label}</div>
                        <div className="text-[11px] text-white/40">{e.type} • {format(e.date, "MMM d")}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-white/30 group-hover:text-white/60 transition-colors">
                      {relativeStr}
                    </div>
                  </div>
                )
              })}
              {upcomingEvents.length === 0 && (
                <div className="text-white/40 text-sm">No upcoming dates soon.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ReactFlowProvider>
  )
}
