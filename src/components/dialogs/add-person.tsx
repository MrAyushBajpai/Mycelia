"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useGraphStore } from "@/stores/graph-store"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPersonDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("")
  const { nodes, setNodes } = useGraphStore()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const id = `p-${Date.now()}`
    const newNode = {
      id,
      type: "person" as const,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 50 },
      data: { label: name.trim() },
    }

    setNodes([...nodes, newNode])
    setName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person-name">Name</Label>
            <Input
              id="person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full">Add</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
