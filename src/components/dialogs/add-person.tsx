"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useGraphStore } from "@/stores/graph-store"
import { createClient } from "@/lib/supabase/client"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPersonDialog({ open, onOpenChange }: Props) {
  const supabase = createClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  
  const [clusterId, setClusterId] = useState("")
  const [newClusterName, setNewClusterName] = useState("")
  
  const [relationship, setRelationship] = useState("")
  const [newRelationshipName, setNewRelationshipName] = useState("")
  
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const setNodes = useGraphStore((s) => s.setNodes)
  const setEdges = useGraphStore((s) => s.setEdges)

  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  
  const clusters = nodes.filter(n => n.type === "cluster")
  
  // Extract unique relationship labels from edges
  const uniqueRelationships = useMemo(() => {
    const labels = edges.map(e => e.label as string).filter(Boolean)
    return Array.from(new Set(labels)).sort()
  }, [edges])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const personId = crypto.randomUUID()
    const ui_x = Math.round(Math.random() * 400 + 100)
    const ui_y = Math.round(Math.random() * 300 + 50)

    const newNode = {
      id: personId,
      type: "person" as const,
      position: { x: ui_x, y: ui_y },
      data: { 
        label: name.trim(), 
        email: email || null, 
        phone: phone || null,
        notes: notes.trim() || null
      },
    }

    const currentNodes = useGraphStore.getState().nodes
    let finalClusterId = clusterId

    // 1. Save Person
    await supabase.from("contacts").insert({
      id: personId,
      user_id: user.id,
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      notes: notes.trim() || null,
      ui_x,
      ui_y
    })

    // Handle inline cluster creation
    if (clusterId === "__NEW__" && newClusterName.trim()) {
      finalClusterId = crypto.randomUUID()
      const c_x = Math.round(Math.random() * 400 + 100)
      const c_y = Math.round(Math.random() * 300 + 50)

      const newClusterNode = {
        id: finalClusterId,
        type: "cluster" as const,
        position: { x: c_x, y: c_y },
        data: { label: newClusterName.trim(), color: "#3b82f6" }, 
      }

      await supabase.from("clusters").insert({
        id: finalClusterId,
        user_id: user.id,
        name: newClusterName.trim(),
        color: "#3b82f6",
        ui_x: c_x,
        ui_y: c_y
      })

      setNodes([...currentNodes, newClusterNode, newNode])
    } else {
      setNodes([...currentNodes, newNode])
    }

    if (finalClusterId && finalClusterId !== "__NEW__") {
      const finalRelationship = relationship === "__NEW__" ? newRelationshipName.trim() : relationship.trim()
      
      await supabase.from("contact_clusters").insert({
        contact_id: personId,
        cluster_id: finalClusterId
      })

      const currentEdges = useGraphStore.getState().edges
      setEdges([...currentEdges, { 
        id: `cc-${personId}-${finalClusterId}`, 
        source: personId, 
        target: finalClusterId,
        label: finalRelationship || undefined
      }])
    }

      setName("")
      setEmail("")
      setPhone("")
      setClusterId("")
      setNewClusterName("")
      setRelationship("")
      setNewRelationshipName("")
      setNotes("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#050508] border border-white/10 shadow-[0_16px_64px_rgba(0,0,0,0.9)] text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white/90">Add Person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          
          <div className="space-y-1.5">
            <Label htmlFor="person-name" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Name *</Label>
            <Input id="person-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah" maxLength={100} autoFocus className="bg-white/5 border-white/10 h-9" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="person-email" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Email</Label>
              <Input id="person-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" maxLength={255} className="bg-white/5 border-white/10 h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="person-phone" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Phone</Label>
              <Input id="person-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optional" maxLength={50} className="bg-white/5 border-white/10 h-9" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="person-cluster" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Circle (Context)</Label>
              <select
                id="person-cluster"
                value={clusterId}
                onChange={(e) => setClusterId(e.target.value)}
                className="w-full h-9 rounded-md border border-white/10 bg-white/5 text-white px-3 text-sm [color-scheme:dark] outline-none focus:border-primary/50 transition-colors"
              >
                <option value="" className="bg-[#121212]">None</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#121212]">
                    {String((c.data as Record<string, unknown>).label)}
                  </option>
                ))}
                <option value="__NEW__" className="bg-[#121212] italic text-primary/80">+ Add new circle...</option>
              </select>
              {clusterId === "__NEW__" && (
                <Input 
                  value={newClusterName} 
                  onChange={(e) => setNewClusterName(e.target.value)} 
                  placeholder="New circle name" 
                  maxLength={50} 
                  className="bg-white/5 border-white/10 h-9 mt-1.5"
                  autoFocus
                />
              )}
            </div>
            
            <div className="space-y-1.5 flex flex-col">
              <Label htmlFor="person-relationship" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Relationship</Label>
              <select
                id="person-relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full h-9 rounded-md border border-white/10 bg-white/5 text-white px-3 text-sm [color-scheme:dark] outline-none focus:border-primary/50 transition-colors"
                disabled={!clusterId}
                title={!clusterId ? "Select a Circle first to set relationship" : ""}
              >
                <option value="" className="bg-[#121212]">Default</option>
                {uniqueRelationships.map((r) => (
                  <option key={r} value={r} className="bg-[#121212]">{r}</option>
                ))}
                <option value="__NEW__" className="bg-[#121212] italic text-primary/80">+ Add new relationship...</option>
              </select>
              {relationship === "__NEW__" && (
                <Input 
                  value={newRelationshipName} 
                  onChange={(e) => setNewRelationshipName(e.target.value)} 
                  placeholder="New relationship" 
                  maxLength={50} 
                  className="bg-white/5 border-white/10 h-9 mt-1.5"
                  autoFocus
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="person-notes" className="text-white/70 text-xs uppercase tracking-wider font-semibold">Notes</Label>
            <textarea
              id="person-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Background context..."
              className="w-full bg-white/5 border border-white/10 rounded-md p-2.5 text-sm min-h-[80px] outline-none focus:border-primary/50 transition-colors resize-y placeholder:text-muted-foreground/50"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2 font-medium">
            {isSubmitting ? "Adding..." : "Add Person"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
