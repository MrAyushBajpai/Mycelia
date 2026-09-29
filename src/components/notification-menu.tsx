"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, CheckCircle2 } from "lucide-react"
import { useNotificationStore } from "@/stores/notification-store"
import { useGraphStore } from "@/stores/graph-store"
import { useReactFlow } from "@xyflow/react"
import { Button } from "./ui/button"

export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const notifications = useNotificationStore(s => s.notifications)
  const markAsRead = useNotificationStore(s => s.markAsRead)
  const markAllAsRead = useNotificationStore(s => s.markAllAsRead)
  
  const selectNode = useGraphStore(s => s.selectNode)
  const reactFlow = useReactFlow()
  
  const unreadCount = notifications.filter(n => !n.isRead).length
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideInteraction(e: Event) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        e.stopPropagation() 
      }
    }
    
    function handleGlobalKeys(e: KeyboardEvent) {
      const activeTag = document.activeElement?.tagName
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA"
      if (!isTyping && e.key.toLowerCase() === "n") {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    
    document.addEventListener("keydown", handleGlobalKeys)

    if (open) {
      document.addEventListener("pointerdown", handleOutsideInteraction, { capture: true })
      document.addEventListener("keydown", handleEsc, { capture: true })
    }
    return () => {
      document.removeEventListener("keydown", handleGlobalKeys)
      document.removeEventListener("pointerdown", handleOutsideInteraction, { capture: true })
      document.removeEventListener("keydown", handleEsc, { capture: true })
    }
  }, [open])

  function handleNotificationClick(nodeId?: string) {
    if (!nodeId) return
    const nodes = useGraphStore.getState().nodes
    const target = nodes.find(n => n.id === nodeId)
    if (target) {
      selectNode(nodeId)
      reactFlow.fitView({ nodes: [target], duration: 400, padding: 2 })
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative text-white/50 hover:text-white/90 hover:bg-white/10"
        onClick={() => setOpen(!open)}
        title="Notifications (N)"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <div className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        )}
      </Button>

      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-[12px] font-medium tracking-wide text-white/90 uppercase">Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] text-white/40 hover:text-white/90 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-white/40 text-[12px]">
                No notifications yet.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(n => (
                  <div 
                    key={n.id}
                    className={`flex items-start gap-3 p-3 border-b border-white/5 last:border-0 transition-colors ${!n.isRead ? 'bg-white/[0.03]' : 'opacity-60'} hover:bg-white/[0.06] cursor-pointer`}
                    onClick={() => handleNotificationClick(n.nodeId)}
                  >
                    <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${n.type === 'overdue' ? 'bg-destructive' : n.type === 'due' ? 'bg-amber-500' : 'bg-purple-500'} ${!n.isRead ? 'animate-pulse' : 'opacity-50'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${!n.isRead ? 'text-white/90' : 'text-white/60'}`}>{n.title}</p>
                      <p className="text-[12px] text-white/50 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-white/30 mt-1.5 uppercase tracking-wide">
                         {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button 
                        className="text-white/20 hover:text-primary transition-colors p-1"
                        onClick={(e) => { e.stopPropagation(); markAsRead(n.id) }}
                        title="Mark as Read"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
