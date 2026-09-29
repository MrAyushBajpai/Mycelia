"use client"

import * as React from "react"
import { useState, useEffect } from "react"
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
  
  const edges = useGraphStore((s) => s.edges)
  const interactions = useInteractionStore((s) => s.interactionsByContact[node?.id || ""] || EMPTY_ARRAY)
  const addInteraction = useInteractionStore((s) => s.addInteraction)

  const [logInput, setLogInput] = useState("")
  const [logDate, setLogDate] = useState("")
  const [newDateLabel, setNewDateLabel] = useState("")
  const [newDateValue, setNewDateValue] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Reset confirmation state when node changes
  React.useEffect(() => {
    setConfirmDelete(false)
  }, [selectedNodeId])

  if (!node || node.type === "cluster") return null

  const data = node.data as Record<string, unknown>
  const customDates = (data.customDates as Record<string, string>) || {}
  
  const connectedNodes = edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const otherId = e.source === node.id ? e.target : e.source
      const other = useGraphStore.getState().nodes.find((n) => n.id === otherId)
      return { edge: e, name: other ? String((other.data as Record<string, unknown>).label) : "?" }
    })

  // Computed Follow-up Logic
  const lastContactedDate = data.lastContacted ? new Date(data.lastContacted as string) : null
  const cadence = data.cadenceDays as number | null

  let lastContactedStr = "Never"
  if (lastContactedDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const last = new Date(lastContactedDate)
    last.setHours(0, 0, 0, 0)
    const days = Math.floor((today.getTime() - last.getTime()) / 86400000)
    
    if (days === 0) lastContactedStr = "Today"
    else if (days === 1) lastContactedStr = "Yesterday"
    else lastContactedStr = `${days} days ago`
  }

  let nextContactStr = "—"
  let isOverdue = false
  if (lastContactedDate && cadence) {
    const nextDate = new Date(lastContactedDate.getTime() + cadence * 86400000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const next = new Date(nextDate)
    next.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / 86400000)
    
    if (diffDays < 0) {
      nextContactStr = `Overdue by ${Math.abs(diffDays)} days`
      isOverdue = true
    } else if (diffDays === 0) {
      nextContactStr = "Today"
    } else if (diffDays === 1) {
      nextContactStr = "Tomorrow"
    } else {
      nextContactStr = nextDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    }
  } else if (!lastContactedDate && cadence) {
    nextContactStr = "Overdue (Never contacted)"
    isOverdue = true
  }

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
    <aside className="absolute right-3 top-3 bottom-3 w-[calc(100vw-24px)] sm:right-4 sm:top-4 sm:bottom-4 sm:w-[360px] rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)] p-5 z-40 flex flex-col overflow-y-auto text-white/90 animate-in slide-in-from-right-8 duration-500 ease-out">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-sm font-semibold text-white/50 uppercase">
            {String(data.label).charAt(0)}
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{String(data.label)}</h2>
        </div>
        <button onClick={() => selectNode(null)} className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/[0.06]">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-6 text-sm flex-1">
        
        <Section title="Contact">
          <EditableField label="Email" value={data.email as string} onChange={(v) => updateField("email", v)} maxLength={255} />
          <EditableField label="Phone" value={data.phone as string} onChange={(v) => updateField("phone", v)} maxLength={50} />
        </Section>

        <Section title="Action & History">
          <DisplayField label="Last interaction" value={lastContactedStr} />
          <DisplayField label="Next follow-up" value={nextContactStr} alert={isOverdue} highlight={!isOverdue && nextContactStr !== "—"} />
          <div className="flex flex-col mt-1">
            <span className="text-[12px] font-normal text-white/40 py-1">Reason for next contact</span>
            <textarea
              value={(data.nextActionReason as string) || ""}
              onChange={(e) => updateField("nextActionReason", e.target.value)}
              placeholder="What to discuss next..."
              className="w-full bg-transparent border border-transparent hover:bg-white/[0.03] hover:border-white/5 rounded-lg p-2 -ml-2 text-[13px] font-normal min-h-[40px] outline-none focus:bg-black/20 focus:border-primary/30 transition-all resize-none overflow-hidden placeholder:text-white/30 text-white/90"
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
              }}
            />
          </div>
          <div className="flex items-center justify-between py-1.5 gap-4 group mt-1 pt-2 border-t border-white/5">
            <span className="text-[12px] font-normal text-white/40 shrink-0">Keep in touch</span>
            <select
              value={(data.cadenceDays as number) || ""}
              onChange={(e) => updateField("cadenceDays", e.target.value)}
              className="bg-transparent text-right text-[13px] font-normal outline-none w-full min-w-0 text-white/90 focus:text-primary transition-colors cursor-pointer appearance-none [&>option]:bg-[#121212] [&>option]:text-white/90"
              style={{ textAlignLast: "right" }}
            >
              <option value="">No schedule</option>
              <option value="7">Weekly</option>
              <option value="14">Every 2 weeks</option>
              <option value="30">Monthly</option>
              <option value="90">Quarterly</option>
              <option value="180">Every 6 months</option>
              <option value="365">Yearly</option>
            </select>
          </div>
        </Section>

        {connectedNodes.length > 0 && (
          <Section title="Connections">
            {connectedNodes.map(({ edge, name }) => (
              <div key={edge.id} className="flex items-center justify-between py-1">
                <span className="text-[13px] font-normal text-white/90">{name}</span>
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">{edge.label || "Connected"}</span>
              </div>
            ))}
          </Section>
        )}

        <Section title="Recent Interactions">
          <form onSubmit={handleLog} className="flex flex-col gap-1.5 mb-3">
            <div className="flex gap-1.5">
              <Input
                id="interaction-input"
                value={logInput}
                onChange={(e) => setLogInput(e.target.value)}
                placeholder="Log an interaction..."
                maxLength={2000}
                className="h-8 text-xs bg-black/20 border-white/10"
              />
              <Button type="submit" size="icon-sm" variant="ghost" className="bg-black/20 border border-white/10 hover:bg-white/10">
                <Send size={14} />
              </Button>
            </div>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="text-[11px] px-1 py-0.5 text-muted-foreground bg-transparent outline-none self-start"
              title="Date of interaction (defaults to today)"
            />
          </form>
          {interactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-5 text-center bg-white/[0.02] border border-white/5 rounded-lg mt-2">
              <p className="text-[13px] font-medium text-white/80">No interactions yet</p>
              <p className="text-[11px] text-white/40 mt-1 mb-3">Keep your relationship history here.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[11px] bg-transparent border-white/10 hover:bg-white/10 text-white/70"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById("interaction-input")?.focus()
                }}
              >
                Log first interaction
              </Button>
            </div>
          ) : (
            <div className="space-y-1 mt-3">
              {interactions.slice(0, 5).map((i) => (
                <div key={i.id} className="flex items-start justify-between py-1.5 border-t border-white/5 first:border-0">
                  <p className="text-sm pr-4 line-clamp-2 leading-relaxed">{i.note}</p>
                  <span className="text-[10px] text-white/30 shrink-0 mt-0.5 tabular-nums">
                    {new Date(i.occurredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Important Dates">
          {Object.entries(customDates).map(([lbl, val]) => (
            <div key={lbl} className="flex items-center justify-between py-1 group">
              <span className="text-[12px] font-normal text-white/40">{lbl}</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-normal text-white/90">{new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <button onClick={() => removeCustomDate(lbl)} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
          <form onSubmit={handleAddCustomDate} className="flex gap-1.5 mt-2">
            <Input value={newDateLabel} onChange={(e) => setNewDateLabel(e.target.value)} placeholder="Label (e.g. Birthday)" maxLength={50} className="h-7 text-xs flex-1 bg-black/20 border-white/10" />
            <input type="date" value={newDateValue} onChange={(e) => setNewDateValue(e.target.value)} className="text-xs bg-black/20 border border-white/10 rounded px-1.5 h-7 outline-none w-28 text-muted-foreground" />
            <Button type="submit" size="icon-sm" variant="ghost" className="h-7 w-7 bg-black/20 border border-white/10 hover:bg-white/10"><Send size={10} /></Button>
          </form>
        </Section>

        <Section title="Notes">
          <textarea
            value={(data.notes as string) || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Add a note..."
            className="w-full bg-transparent border border-transparent hover:bg-white/[0.03] hover:border-white/5 rounded-lg p-2 -ml-2 text-[13px] font-normal min-h-[60px] outline-none focus:bg-black/20 focus:border-primary/30 transition-all resize-none overflow-hidden placeholder:text-white/20"
            onInput={(e) => {
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
            }}
          />
        </Section>
      </div>

      {!confirmDelete ? (
        <Button variant="ghost" size="sm" className="w-full mt-6 text-white/30 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={13} data-icon="inline-start" />
          Remove Person
        </Button>
      ) : (
        <div className="mt-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-sm font-medium text-destructive">Remove {String(data.label)}?</p>
          <p className="text-xs text-white/60 leading-relaxed mb-1">
            This will remove {String(data.label)} and their relationship connections from your graph.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs hover:bg-white/5" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => deleteNode(node.id)}>Remove</Button>
          </div>
        </div>
      )}
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/30 mb-3">{title}</h3>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
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
    <div className="flex items-center justify-between py-1.5 gap-4 group">
      <span className="text-[12px] font-normal text-white/40 shrink-0">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        maxLength={maxLength}
        min={min}
        className="bg-transparent text-right text-[13px] font-normal outline-none w-full min-w-0 text-white/90 placeholder:text-muted-foreground/30 focus:text-primary transition-colors"
      />
    </div>
  )
}

function DisplayField({
  label,
  value,
  highlight = false,
  alert = false
}: {
  label: string
  value: string
  highlight?: boolean
  alert?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-4">
      <span className="text-[12px] font-normal text-white/40 shrink-0">{label}</span>
      <span className={`text-[13px] text-right ${alert ? 'text-destructive font-semibold' : highlight ? 'text-primary font-medium' : 'text-white/90 font-normal'}`}>{value}</span>
    </div>
  )
}
