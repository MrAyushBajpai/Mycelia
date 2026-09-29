import { create } from "zustand"

export type Interaction = {
  id: string
  contactId: string
  note: string
  occurredAt: string
}

type InteractionState = {
  // mapped by contactId for O(1) lookup
  interactionsByContact: Record<string, Interaction[]>
  addInteraction: (contactId: string, note: string, occurredAt?: string) => void
  getByContact: (contactId: string) => Interaction[]
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  interactionsByContact: {},

  addInteraction: (contactId, note, occurredAt) => {
    const interaction: Interaction = {
      id: `i-${Date.now()}`,
      contactId,
      note,
      occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
    }
    set((state) => {
      const existing = state.interactionsByContact[contactId] || []
      // Insert sorted (newest first assuming mostly adding new ones)
      const updated = [interaction, ...existing].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
      return {
        interactionsByContact: {
          ...state.interactionsByContact,
          [contactId]: updated,
        },
      }
    })
  },

  getByContact: (contactId) => {
    return get().interactionsByContact[contactId] || []
  },
}))
