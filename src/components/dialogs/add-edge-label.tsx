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
  const onConnect = useGraphStore((s) => s.onConnect)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!connection) return
    onConnect(connection, label.trim() || undefined)
    setLabel("")
    onOpenChange(false)
  }

  function handleSkip() {
    if (!connection) return
    onConnect(connection)
    setLabel("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#050508] border border-white/10 shadow-[0_16px_64px_rgba(0,0,0,0.9)] text-white rounded-2xl">
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
              className="bg-white/5 border-white/10"
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
