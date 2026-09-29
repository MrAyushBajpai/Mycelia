import { create } from "zustand"

export type Interaction = {
  id: string
  contactId: string
  note: string
  occurredAt: string
}

type InteractionState = {
  interactions: Interaction[]
  addInteraction: (contactId: string, note: string, occurredAt?: string) => void
  getByContact: (contactId: string) => Interaction[]
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  interactions: [],

  addInteraction: (contactId, note, occurredAt) => {
    const interaction: Interaction = {
      id: `i-${Date.now()}`,
      contactId,
      note,
      occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
    }
    set({ interactions: [...get().interactions, interaction] })
  },

  getByContact: (contactId) => {
    return get()
      .interactions.filter((i) => i.contactId === contactId)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  },
}))
