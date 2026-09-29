import { create } from "zustand";

export const useTimeStore = create<{ now: number }>((set) => {
  setInterval(() => {
    set({ now: Date.now() });
  }, 60000); // 1 minute
  
  return { now: Date.now() };
});

