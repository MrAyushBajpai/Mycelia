"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useGraphStore } from "@/stores/graph-store"
import { createAuthenticatedClient } from "@/lib/supabase/client"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPersonDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { userId, getToken } = useAuth()
  const setNodes = useGraphStore((s) => s.setNodes)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      if (!userId) return

      const supabase = await createAuthenticatedClient(() => getToken({ template: "supabase" }))
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
          notes: null
        },
      }

      const currentNodes = useGraphStore.getState().nodes

      // 1. Save Person
      await supabase.from("contacts").insert({
        id: personId,
        user_id: userId,
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        notes: null,
        ui_x,
        ui_y
      })

      setNodes([...currentNodes, newNode])

      setName("")
      setEmail("")
      setPhone("")
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

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2 font-medium">
            {isSubmitting ? "Adding..." : "Add Person"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
