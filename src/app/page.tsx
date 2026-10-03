"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ReactFlowProvider } from "@xyflow/react"
import { GraphCanvas } from "@/components/graph/graph-canvas"
import { ContactDetail } from "@/components/panels/contact-detail"
import { Toolbar } from "@/components/toolbar"
import { CommandBar } from "@/components/command-bar"
import { SearchBar } from "@/components/search-bar"
import { CircleDetail } from "@/components/panels/circle-detail"
import { useGraphSync } from "@/hooks/use-graph-sync"

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login")
      } else {
        setLoadingAuth(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loadingAuth) return null

  return (
    <ReactFlowProvider>
      <main className="relative flex-1">
        <SearchBar />
        <Toolbar />
        <CommandBar />
        <GraphCanvas />
        <ContactDetail />
        <CircleDetail />
      </main>
    </ReactFlowProvider>
  )
}