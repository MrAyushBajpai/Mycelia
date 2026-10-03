import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"

export type Interaction = {
  id: string
  contact_id: string
  note: string
  occurred_at: string
}

type InteractionState = {
  interactionsByContact: Record<string, Interaction[]>
  setInteractions: (interactions: any[]) => void
  addInteraction: (contactId: string, note: string, occurredAt?: string) => Promise<void>
  getByContact: (contactId: string) => Interaction[]
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  interactionsByContact: {},

  setInteractions: (interactions) => {
    const grouped = interactions.reduce((acc, interaction) => {
      const cid = interaction.contact_id
      if (!acc[cid]) acc[cid] = []
      acc[cid].push(interaction)
      return acc
    }, {} as Record<string, Interaction[]>)

    // Sort all arrays
    for (const key in grouped) {
      grouped[key].sort((a: Interaction, b: Interaction) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    }

    set({ interactionsByContact: grouped })
  },

  addInteraction: async (contactId, note, occurredAt) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const occurred = occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString()
    
    // Optimistic insert
    const tempId = `temp-${Date.now()}`
    const tempInteraction: Interaction = {
      id: tempId,
      contact_id: contactId,
      note,
      occurred_at: occurred,
    }

    set((state) => {
      const existing = state.interactionsByContact[contactId] || []
      const updated = [tempInteraction, ...existing].sort(
        (a: Interaction, b: Interaction) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      )
      return {
        interactionsByContact: {
          ...state.interactionsByContact,
          [contactId]: updated,
        },
      }
    })

    // Persist to DB
    const { data, error } = await supabase.from('interactions').insert({
      user_id: user.id,
      contact_id: contactId,
      note,
      occurred_at: occurred
    }).select().single()

    if (data && !error) {
      // Replace temp with real
      set((state) => {
        const existing = state.interactionsByContact[contactId] || []
        const updated = existing.map(i => i.id === tempId ? data : i)
        return {
          interactionsByContact: {
            ...state.interactionsByContact,
            [contactId]: updated,
          },
        }
      })
    }
  },

  getByContact: (contactId) => {
    return get().interactionsByContact[contactId] || []
  },
}))
