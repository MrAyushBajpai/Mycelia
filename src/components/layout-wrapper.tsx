"use client"

import { usePathname } from "next/navigation"
import { useUIStore } from "@/stores/ui-store"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore()
  const pathname = usePathname()

  const isLogin = pathname === "/login"

  return (
    <div className={`flex flex-col flex-1 min-h-screen transition-[margin] duration-500 ease-out ${sidebarOpen && !isLogin ? "ml-[260px]" : "ml-0"}`}>
      {children}
    </div>
  )
}
