"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useGraphStore } from "@/stores/graph-store"
import { createClient } from "@/lib/supabase/client"

import { CLUSTER_COLORS } from "@/lib/constants"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddClusterDialog({ open, onOpenChange }: Props) {
  const supabase = createClient()
  const [name, setName] = useState("")
  const [color, setColor] = useState(CLUSTER_COLORS[0])
  const setNodes = useGraphStore((s) => s.setNodes)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const clusterId = crypto.randomUUID()
    const ui_x = Math.round(Math.random() * 300)
    const ui_y = Math.round(Math.random() * 300)

    const newNode = {
      id: clusterId,
      type: "cluster" as const,
      position: { x: ui_x, y: ui_y },
      data: { label: name.trim(), color },
    }

    await supabase.from("clusters").insert({
      id: clusterId,
      user_id: user.id,
      name: name.trim(),
      color,
      ui_x,
      ui_y
    })

    const currentNodes = useGraphStore.getState().nodes
    setNodes([...currentNodes, newNode])
    
    setName("")
    setColor(CLUSTER_COLORS[0])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#050508] border border-white/10 shadow-[0_16px_64px_rgba(0,0,0,0.9)] text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white/90">Add Circle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cluster-name">Name</Label>
            <Input
              id="cluster-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. College, Book Club"
              maxLength={100}
              className="bg-white/5 border-white/10"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {CLUSTER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? c : "transparent",
                    transform: color === c ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Add Circle</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
