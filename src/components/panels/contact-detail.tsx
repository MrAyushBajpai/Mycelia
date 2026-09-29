"use client"

import { useState } from "react"
import { X, Trash2, Send } from "lucide-react"
import { useGraphStore } from "@/stores/graph-store"
import { useInteractionStore } from "@/stores/interaction-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const EMPTY_ARRAY: any[] = []

export function ContactDetail() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const node = useGraphStore((s) => s.nodes.find((n) => n.id === selectedNodeId))
  const selectNode = useGraphStore((s) => s.selectNode)
  const deleteNode = useGraphStore((s) => s.deleteNode)
  const setNodes = useGraphStore((s) => s.setNodes)
  
  // We only subscribe to edges here so that dragging a node (which updates 'nodes' reference)
  // doesn't cause a re-render loop via getConnections.
  const edges = useGraphStore((s) => s.edges)
  
  const interactions = useInteractionStore((s) => s.interactionsByContact[node?.id || ""] || EMPTY_ARRAY)
  const addInteraction = useInteractionStore((s) => s.addInteraction)

  const [logInput, setLogInput] = useState("")
  const [logDate, setLogDate] = useState("")

  const [newDateLabel, setNewDateLabel] = useState("")
  const [newDateValue, setNewDateValue] = useState("")

  if (!node || node.type === "cluster") return null

  const data = node.data as Record<string, unknown>
  const customDates = (data.customDates as Record<string, string>) || {}
  
  // Compute connections manually to avoid store thrashing on drag
  const connectedNodes = edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const otherId = e.source === node.id ? e.target : e.source
      const other = useGraphStore.getState().nodes.find((n) => n.id === otherId)
      return { edge: e, name: other ? String((other.data as Record<string, unknown>).label) : "?" }
    })

  function handleLog(e: React.FormEvent) {
    e.preventDefault()
    if (!logInput.trim()) return
    const d = logDate || new Date().toISOString().split("T")[0]
    addInteraction(node!.id, logInput.trim(), d)
    
    const currentLastContacted = data.lastContacted ? new Date(data.lastContacted as string).getTime() : 0
    const newInteractionTime = new Date(d).getTime()
    
    if (newInteractionTime >= currentLastContacted) {
      const currentNodes = useGraphStore.getState().nodes
      const updated = currentNodes.map((n) =>
        n.id === node!.id ? { ...n, data: { ...n.data, lastContacted: new Date(d).toISOString() } } : n
      )
      setNodes(updated)
    }
    setLogInput("")
    setLogDate("")
  }

  function updateField(field: string, value: string) {
    const currentNodes = useGraphStore.getState().nodes
    const updated = currentNodes.map((n) => {
      if (n.id !== node!.id) return n
      const parsedValue = field === "cadenceDays" ? (value ? parseInt(value, 10) : null) : (value || null)
      return { ...n, data: { ...n.data, [field]: parsedValue } }
    })
    setNodes(updated)
  }

  function handleAddCustomDate(e: React.FormEvent) {
    e.preventDefault()
    if (!newDateLabel.trim() || !newDateValue) return
    const currentNodes = useGraphStore.getState().nodes
    const updated = currentNodes.map((n) => {
      if (n.id !== node!.id) return n
      const existing = (n.data.customDates as Record<string, string>) || {}
      return { ...n, data: { ...n.data, customDates: { ...existing, [newDateLabel.trim()]: newDateValue } } }
    })
    setNodes(updated)
    setNewDateLabel("")
    setNewDateValue("")
  }

  function removeCustomDate(labelToRemove: string) {
    const currentNodes = useGraphStore.getState().nodes
    const updated = currentNodes.map((n) => {
      if (n.id !== node!.id) return n
      const existing = { ...((n.data.customDates as Record<string, string>) || {}) }
      delete existing[labelToRemove]
      return { ...n, data: { ...n.data, customDates: existing } }
    })
    setNodes(updated)
  }

  return (
    <aside className="absolute right-3 top-3 bottom-3 w-[calc(100vw-24px)] sm:right-4 sm:top-4 sm:bottom-4 sm:w-80 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)] p-5 z-10 flex flex-col overflow-y-auto text-white/90 animate-in slide-in-from-right-8 duration-500 ease-out">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-sm font-semibold text-white/50 uppercase">
            {String(data.label).charAt(0)}
          </div>
          <h2 className="text-lg font-semibold tracking-tight">{String(data.label)}</h2>
        </div>
        <button onClick={() => selectNode(null)} className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/[0.06]">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-5 text-sm flex-1">
        <Section title="Details">
          <EditableField label="Email" value={data.email as string} onChange={(v) => updateField("email", v)} maxLength={255} />
          <EditableField label="Phone" value={data.phone as string} onChange={(v) => updateField("phone", v)} maxLength={50} />
          <EditableField label="Cadence (days)" value={data.cadenceDays ? String(data.cadenceDays) : ""} onChange={(v) => updateField("cadenceDays", v)} type="number" min={1} />
          <EditableField label="Notes" value={data.notes as string} onChange={(v) => updateField("notes", v)} maxLength={2000} />
        </Section>

        <Section title="Important Dates">
          {Object.entries(customDates).map(([lbl, val]) => (
            <div key={lbl} className="flex items-center justify-between py-1 group">
              <span className="text-muted-foreground">{lbl}</span>
              <div className="flex items-center gap-2">
                <span>{new Date(val).toLocaleDateString()}</span>
                <button onClick={() => removeCustomDate(lbl)} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
          <form onSubmit={handleAddCustomDate} className="flex gap-1 mt-2">
            <Input value={newDateLabel} onChange={(e) => setNewDateLabel(e.target.value)} placeholder="Label (e.g. Anniversary)" maxLength={50} className="h-7 text-xs flex-1" />
            <input type="date" value={newDateValue} onChange={(e) => setNewDateValue(e.target.value)} className="text-xs bg-transparent border rounded px-1 h-7 outline-none w-28" />
            <Button type="submit" size="icon-sm" variant="ghost" className="h-7 w-7"><Send size={12} /></Button>
          </form>
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
          <form onSubmit={handleLog} className="flex flex-col gap-1.5 mb-3">
            <div className="flex gap-1.5">
              <Input
                value={logInput}
                onChange={(e) => setLogInput(e.target.value)}
                placeholder="Log an interaction..."
                maxLength={2000}
                className="h-8 text-xs"
              />
              <Button type="submit" size="icon-sm" variant="ghost">
                <Send size={14} />
              </Button>
            </div>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="text-xs text-muted-foreground bg-transparent outline-none self-start"
              title="Date of interaction (defaults to today)"
            />
          </form>
          {interactions.length === 0 ? (
            <p className="text-muted-foreground">No interactions logged.</p>
          ) : (
            <div className="space-y-2">
              {interactions.map((i) => (
                <div key={i.id} className="border-l border-white/[0.08] pl-3 py-1.5">
                  <p className="text-sm">{i.note}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {new Date(i.occurredAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Button variant="ghost" size="sm" className="w-full mt-4 text-white/30 hover:text-destructive hover:bg-destructive/10" onClick={() => deleteNode(node.id)}>
        <Trash2 size={13} data-icon="inline-start" />
        Remove
      </Button>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-2.5">{title}</h3>
      {children}
    </div>
  )
}

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  min,
}: {
  label: string
  value: string | null | undefined
  onChange: (v: string) => void
  type?: string
  maxLength?: number
  min?: number
}) {
  return (
    <div className="flex items-center justify-between py-1 gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        maxLength={maxLength}
        min={min}
        className="bg-transparent text-right text-sm outline-none w-full min-w-0 placeholder:text-muted-foreground/50 focus:underline"
      />
    </div>
  )
}
