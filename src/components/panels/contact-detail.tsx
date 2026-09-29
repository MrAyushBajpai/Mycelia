"use client"

import { useState } from "react"
import { X, Trash2, Send } from "lucide-react"
import { useGraphStore } from "@/stores/graph-store"
import { useInteractionStore } from "@/stores/interaction-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ContactDetail() {
  const { nodes, edges, selectedNodeId, selectNode, deleteNode, setNodes } = useGraphStore()
  const { addInteraction, getByContact } = useInteractionStore()
  const [logInput, setLogInput] = useState("")

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node || node.type === "cluster") return null

  const data = node.data as Record<string, unknown>
  const interactions = getByContact(node.id)
  const connections = edges.filter((e) => e.source === node.id || e.target === node.id)
  const connectedNodes = connections.map((e) => {
    const otherId = e.source === node.id ? e.target : e.source
    const other = nodes.find((n) => n.id === otherId)
    return { edge: e, name: other ? String((other.data as Record<string, unknown>).label) : "?" }
  })

  function handleLog(e: React.FormEvent) {
    e.preventDefault()
    if (!logInput.trim()) return
    addInteraction(node!.id, logInput.trim())
    // update last contacted
    const updated = nodes.map((n) =>
      n.id === node!.id ? { ...n, data: { ...n.data, lastContacted: new Date().toISOString() } } : n
    )
    setNodes(updated)
    setLogInput("")
  }

  function updateField(field: string, value: string) {
    const updated = nodes.map((n) =>
      n.id === node!.id ? { ...n, data: { ...n.data, [field]: value || null } } : n
    )
    setNodes(updated)
  }

  return (
    <aside className="absolute right-0 top-0 h-screen w-80 border-l bg-card p-5 shadow-lg z-10 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{String(data.label)}</h2>
        <button onClick={() => selectNode(null)} className="text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5 text-sm flex-1">
        <Section title="Details">
          <EditableField label="Email" value={data.email as string} onChange={(v) => updateField("email", v)} />
          <EditableField label="Phone" value={data.phone as string} onChange={(v) => updateField("phone", v)} />
          <EditableField label="Birthday" value={data.birthday as string} onChange={(v) => updateField("birthday", v)} type="date" />
          <EditableField label="Notes" value={data.notes as string} onChange={(v) => updateField("notes", v)} />
        </Section>

        {connectedNodes.length > 0 && (
          <Section title="Connections">
            {connectedNodes.map(({ edge, name }) => (
              <div key={edge.id} className="flex items-center gap-2 py-1">
                <span className="text-muted-foreground text-xs">{edge.label || "—"}</span>
                <span className="font-medium">{name}</span>
              </div>
            ))}
          </Section>
        )}

        <Section title="Interactions">
          <form onSubmit={handleLog} className="flex gap-1.5 mb-3">
            <Input
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder="Log an interaction..."
              className="h-8 text-xs"
            />
            <Button type="submit" size="icon-sm" variant="ghost">
              <Send size={14} />
            </Button>
          </form>
          {interactions.length === 0 ? (
            <p className="text-muted-foreground">No interactions logged.</p>
          ) : (
            <div className="space-y-2">
              {interactions.map((i) => (
                <div key={i.id} className="border-l-2 border-muted pl-3 py-1">
                  <p>{i.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(i.occurredAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Button variant="destructive" size="sm" className="w-full mt-4" onClick={() => deleteNode(node.id)}>
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

function EditableField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string | null | undefined
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="flex items-center justify-between py-1 gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="bg-transparent text-right text-sm outline-none w-full min-w-0 placeholder:text-muted-foreground/50 focus:underline"
      />
    </div>
  )
}
