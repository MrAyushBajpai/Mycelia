"use client"

import { X, Trash2 } from "lucide-react"
import { useGraphStore } from "@/stores/graph-store"
import { Button } from "@/components/ui/button"

export function ContactDetail() {
  const { nodes, selectedNodeId, selectNode, deleteNode } = useGraphStore()
  const node = nodes.find((n) => n.id === selectedNodeId)

  if (!node || node.type === "cluster") return null

  const data = node.data as Record<string, unknown>

  return (
    <aside className="absolute right-0 top-0 h-screen w-80 border-l bg-card p-5 shadow-lg z-10 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{String(data.label)}</h2>
        <button onClick={() => selectNode(null)} className="text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 text-sm flex-1">
        <Section title="Notes">
          <p className="text-muted-foreground">No notes yet.</p>
        </Section>

        <Section title="Recent Interactions">
          <p className="text-muted-foreground">No interactions logged.</p>
        </Section>

        <Section title="Details">
          <Detail label="Last Contacted" value={data.lastContacted as string | null} />
          <Detail label="Cadence" value={data.cadenceDays ? `Every ${data.cadenceDays} days` : null} />
        </Section>
      </div>

      <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteNode(node.id)}>
        <Trash2 size={14} data-icon="inline-start" />
        Remove
      </Button>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      {children}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span>{value || "—"}</span>
    </div>
  )
}
