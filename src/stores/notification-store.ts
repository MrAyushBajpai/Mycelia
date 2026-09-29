import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Node } from '@xyflow/react'

export type NotificationType = 'due' | 'overdue' | 'event'

export interface AppNotification {
  id: string
  signature: string
  type: NotificationType
  title: string
  message: string
  nodeId?: string
  createdAt: number
  isRead: boolean
}

interface NotificationState {
  notifications: AppNotification[]
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  syncGraph: (nodes: Node[], now: number) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
      })),

      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
      })),

      syncGraph: (nodes, now) => {
        const state = get()
        const newNotifications: AppNotification[] = []
        const todayStr = new Date(now).toISOString().split('T')[0]

        nodes.forEach((node) => {
          if (node.type !== 'person') return
          const d = node.data as any
          const name = String(d.label)

          // 1. Check Follow-ups
          if (d.cadenceDays) {
            let diffDays = 0
            if (d.lastContacted) {
              const today = new Date(now)
              today.setHours(0, 0, 0, 0)
              const last = new Date(d.lastContacted)
              last.setHours(0, 0, 0, 0)
              diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000)
            } else {
              // Never contacted but has cadence -> Overdue immediately
              diffDays = d.cadenceDays + 1 
            }

            const daysUntilDue = d.cadenceDays - diffDays
            
            if (daysUntilDue < 0) {
              // Overdue
              const sig = `overdue_${node.id}_${todayStr}`
              if (!state.notifications.find(n => n.signature === sig) && !newNotifications.find(n => n.signature === sig)) {
                newNotifications.push({
                  id: crypto.randomUUID(),
                  signature: sig,
                  type: 'overdue',
                  title: 'Overdue Contact',
                  message: `${name} is overdue for contact. ${d.nextActionReason ? 'Reason: ' + d.nextActionReason : ''}`,
                  nodeId: node.id,
                  createdAt: now,
                  isRead: false
                })
              }
            } else if (daysUntilDue <= 2) {
              // Due soon
              const sig = `due_${node.id}_${todayStr}`
              if (!state.notifications.find(n => n.signature === sig) && !newNotifications.find(n => n.signature === sig)) {
                newNotifications.push({
                  id: crypto.randomUUID(),
                  signature: sig,
                  type: 'due',
                  title: 'Contact Due Soon',
                  message: `Reach out to ${name} soon. ${d.nextActionReason ? 'Reason: ' + d.nextActionReason : ''}`,
                  nodeId: node.id,
                  createdAt: now,
                  isRead: false
                })
              }
            }
          }

          // 2. Check Custom Dates (e.g. Birthdays)
          if (d.customDates) {
            Object.entries(d.customDates).forEach(([label, dateStr]) => {
              const eventDate = new Date(dateStr as string)
              const currentDate = new Date(now)
              
              // If same month and day
              if (eventDate.getMonth() === currentDate.getMonth() && eventDate.getDate() === currentDate.getDate()) {
                const sig = `event_${node.id}_${label}_${todayStr}`
                if (!state.notifications.find(n => n.signature === sig) && !newNotifications.find(n => n.signature === sig)) {
                  newNotifications.push({
                    id: crypto.randomUUID(),
                    signature: sig,
                    type: 'event',
                    title: `Today: ${label}`,
                    message: `It's ${name}'s ${label} today.`,
                    nodeId: node.id,
                    createdAt: now,
                    isRead: false
                  })
                }
              }
            })
          }
        })

        if (newNotifications.length > 0) {
          set((state) => ({
            notifications: [...newNotifications, ...state.notifications]
          }))
        }
      }
    }),
    {
      name: 'mycelia-notifications'
    }
  )
)
