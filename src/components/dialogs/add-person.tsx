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
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [clusterId, setClusterId] = useState("")
  const { nodes, edges, setNodes, setEdges } = useGraphStore()

  const clusters = nodes.filter((n) => n.type === "cluster")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const id = `p-${Date.now()}`
    const newNode = {
      id,
      type: "person" as const,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 50 },
      data: { label: name.trim(), email: email || null, phone: phone || null },
    }

    setNodes([...nodes, newNode])

    if (clusterId) {
      setEdges([...edges, { id: `e-${Date.now()}`, source: id, target: clusterId }])
    }

    setName("")
    setEmail("")
    setPhone("")
    setClusterId("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="person-name">Name *</Label>
            <Input id="person-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-email">Email</Label>
            <Input id="person-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-phone">Phone</Label>
            <Input id="person-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optional" />
          </div>
          {clusters.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="person-cluster">Circle</Label>
              <select
                id="person-cluster"
                value={clusterId}
                onChange={(e) => setClusterId(e.target.value)}
                className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="">None</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {String((c.data as Record<string, unknown>).label)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="submit" className="w-full">Add</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
