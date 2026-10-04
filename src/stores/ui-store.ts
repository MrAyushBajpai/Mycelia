import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  commandBarOpen: boolean
  setCommandBarOpen: (isOpen: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  commandBarOpen: false,
  setCommandBarOpen: (isOpen) => set({ commandBarOpen: isOpen }),
}))
