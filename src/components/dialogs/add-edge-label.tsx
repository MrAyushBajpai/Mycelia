"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useGraphStore } from "@/stores/graph-store"
import type { Connection } from "@xyflow/react"

type Props = {
  open: boolean
  connection: Connection | null
  onOpenChange: (open: boolean) => void
}

export function AddEdgeLabelDialog({ open, connection, onOpenChange }: Props) {
  const [label, setLabel] = useState("")
  const { edges, setEdges } = useGraphStore()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!connection) return

    const id = `e-${Date.now()}`
    setEdges([...edges, { id, source: connection.source, target: connection.target, label: label.trim() || undefined }])
    setLabel("")
    onOpenChange(false)
  }

  function handleSkip() {
    if (!connection) return
    const id = `e-${Date.now()}`
    setEdges([...edges, { id, source: connection.source, target: connection.target }])
    setLabel("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white/90">Label this connection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edge-label">Relationship</Label>
            <Input
              id="edge-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='e.g. "married to", "works with"'
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={handleSkip}>
              Skip
            </Button>
            <Button type="submit" className="flex-1">
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
