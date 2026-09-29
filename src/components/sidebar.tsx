"use client"

import { useState } from "react"
import { Network, User, Users, Calendar, FileText, Settings, ChevronsLeft, ChevronsUpDown, Menu } from "lucide-react"

const NAV_ITEMS = [
  { name: "Graph", icon: Network, isActive: true },
  { name: "People", icon: User },
  { name: "Groups", icon: Users },
  { name: "Calendar", icon: Calendar },
  { name: "Notes", icon: FileText },
  { name: "Settings", icon: Settings },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Collapsed State: Just the Logo/Hamburger */}
      {!isOpen && (
        <div 
          className="absolute top-5 left-6 z-50 flex items-center gap-2.5 select-none cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:border-primary/40 transition-colors">
            <Menu size={12} className="text-primary absolute opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary group-hover:opacity-0 transition-opacity">
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <span className="text-sm font-medium text-white/50 tracking-wider group-hover:text-white/80 transition-colors">MYCELIA</span>
        </div>
      )}

      {/* Expanded Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#09090b]/95 backdrop-blur-3xl border-r border-white/[0.04] z-50 flex flex-col shadow-2xl transition-transform duration-500 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 select-none mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="2" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/90 tracking-wider">MYCELIA</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <ChevronsLeft size={16} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon size={16} className={item.isActive ? "text-primary" : "text-white/40"} />
                {item.name}
              </button>
            )
          })}
        </div>

        {/* User Profile */}
        <div className="p-4 mb-2">
          <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/[0.04]">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white/90 font-medium text-sm">
              N
            </div>
            <div className="flex flex-col items-start flex-1 overflow-hidden">
              <span className="text-sm font-medium text-white/90 truncate w-full text-left">Nadia</span>
              <span className="text-[11px] text-white/40 truncate w-full text-left">Personal Workspace</span>
            </div>
            <ChevronsUpDown size={14} className="text-white/30 flex-shrink-0" />
          </button>
        </div>
      </div>
      
      {/* Backdrop for mobile / small screens, optional but good for focus. We'll skip for desktop to allow interaction if wanted, but overlay is fine */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
