"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { User, Users, UploadCloud, MessageSquare, ArrowRight, Wand2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPersonDialog } from "@/components/dialogs/add-person"
import { AddClusterDialog } from "@/components/dialogs/add-cluster"
import { ImportCsvDialog } from "@/components/dialogs/import-csv"
import { NotificationMenu } from "@/components/notification-menu"
import { useGraphStore } from "@/stores/graph-store"
import { useUIStore } from "@/stores/ui-store"
import { useReactFlow } from "@xyflow/react"

export function Toolbar() {
  const [personOpen, setPersonOpen] = useState(false)
  const [clusterOpen, setClusterOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const reactFlow = useReactFlow()

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      const activeTag = document.activeElement?.tagName
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA"

      if (e.key === "Escape") {
        if (isTyping) {
          // 1. Escape out of typing mode
          e.preventDefault()
          ;(document.activeElement as HTMLElement).blur()
          return
        }
        
        // 2. Escape out of selection (Right panel)
        const currentSelection = useGraphStore.getState().selectedNodeId
        if (currentSelection) {
          e.preventDefault()
          useGraphStore.getState().selectNode(null)
          return
        }
      }

      if (!isTyping) {
        if (e.key.toLowerCase() === "p") {
          e.preventDefault()
          setPersonOpen(true)
        } else if (e.key.toLowerCase() === "c") {
          e.preventDefault()
          setClusterOpen(true)
        } else if (e.key.toLowerCase() === "l") {
          e.preventDefault()
          useGraphStore.getState().autoLayout()
          requestAnimationFrame(() => requestAnimationFrame(() => reactFlow.fitView({ padding: 0.2, minZoom: 0.5, maxZoom: 1, duration: 400 })))
        } else if (e.key.toLowerCase() === "i") {
          e.preventDefault()
          setImportOpen(true)
        }
      }
    }
    document.addEventListener("keydown", handleGlobalKey)
    return () => document.removeEventListener("keydown", handleGlobalKey)
  }, [])

  return (
    <>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-1 items-center p-1.5 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] animate-in slide-in-from-bottom-5 duration-700 max-w-[calc(100vw-32px)] overflow-x-auto no-scrollbar">
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/90 gap-1.5" onClick={() => setPersonOpen(true)} title="Add a new person (P)">
          <User size={14} />
          <span>Add Person</span>
          <kbd className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono hidden sm:block">P</kbd>
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/90 gap-1.5" onClick={() => setClusterOpen(true)} title="Add a new circle/group (C)">
          <Users size={14} />
          <span>Add Circle</span>
          <kbd className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono hidden sm:block">C</kbd>
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/90 gap-1.5" onClick={() => {
          useGraphStore.getState().autoLayout()
          requestAnimationFrame(() => requestAnimationFrame(() => reactFlow.fitView({ padding: 0.2, minZoom: 0.5, maxZoom: 1, duration: 400 })))
        }} title="Tidy Graph (L)">
          <Wand2 size={14} />
          <span>Tidy</span>
          <kbd className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono hidden sm:block">L</kbd>
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/90 gap-1.5" onClick={() => {
          useGraphStore.getState().autoLayout({ resetPins: true })
          requestAnimationFrame(() => requestAnimationFrame(() => reactFlow.fitView({ padding: 0.2, minZoom: 0.5, maxZoom: 1, duration: 400 })))
        }} title="Reset Layout">
          <RotateCcw size={14} />
          <span>Reset</span>
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <Button variant="ghost" size="icon-sm" className="rounded-full w-8 h-8 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center relative group" onClick={() => setImportOpen(true)} title="Import CSV (I)">
          <UploadCloud size={14} />
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white/70 hover:text-white gap-1.5" onClick={() => useUIStore.getState().setCommandBarOpen(!useUIStore.getState().commandBarOpen)} title="Log interaction (⌘K)">
          <MessageSquare size={14} />
          <span className="text-white/90">Log</span>
          <kbd className="text-[10px] text-white/25 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono hidden sm:block">⌘K</kbd>
        </Button>
        <div className="w-px h-5 bg-white/[0.06]" />
        <NotificationMenu />
        <div className="w-px h-5 bg-white/[0.06]" />
      </div>

      {personOpen && <AddPersonDialog open={personOpen} onOpenChange={setPersonOpen} />}
      {clusterOpen && <AddClusterDialog open={clusterOpen} onOpenChange={setClusterOpen} />}
      {importOpen && <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} />}
    </>
  )
}
