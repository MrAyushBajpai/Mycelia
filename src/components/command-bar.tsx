"use client"

import { useState, useEffect } from "react"
import * as chrono from "chrono-node"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useGraphStore } from "@/stores/graph-store"
import { useInteractionStore } from "@/stores/interaction-store"

export function CommandBar() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  
  const setNodes = useGraphStore(s => s.setNodes)
  const { addInteraction } = useInteractionStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Parse input for @mentions and simple dates
  const words = input.split(" ")
  const matchedNodes = new Set<string>()
  let parsedDate = new Date().toISOString().split("T")[0] // default today
  let dateStringMatch = ""

  // Use chrono-node for natural language date extraction
  const dateResults = chrono.parse(input)
  if (dateResults.length > 0) {
    const result = dateResults[0]
    parsedDate = result.start.date().toISOString().split("T")[0]
    dateStringMatch = result.text
  }

  // O(N) instead of O(W*N)
  const nameIndex = new Map<string, string>() // lowercase label -> id
  if (open) {
    const nodes = useGraphStore.getState().nodes
    nodes.forEach(n => {
      const label = String((n.data as Record<string, unknown>).label).toLowerCase()
      nameIndex.set(label, n.id)
    })
  }

  const renderedText = words.map((word, i) => {
    if (word.startsWith("@") && word.length > 1) {
      const search = word.substring(1).toLowerCase().replace(/[.,!?;:]$/, "")
      
      // Check exact match first
      let matchedId = nameIndex.get(search)
      
      // Fallback to startsWith if no exact match
      if (!matchedId) {
        for (const [label, id] of nameIndex.entries()) {
          if (label.startsWith(search)) {
            matchedId = id
            break
          }
        }
      }
      
      if (matchedId) {
        matchedNodes.add(matchedId)
        return <span key={i} className="text-primary font-medium bg-primary/10 rounded px-1">{word} </span>
      }
    }
    
    // Highlight date phrase
    if (dateStringMatch && dateStringMatch.toLowerCase().includes(word.toLowerCase())) {
       return <span key={i} className="text-amber-500 font-medium">{word} </span>
    }

    return <span key={i}>{word} </span>
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || matchedNodes.size === 0) return

    let cleanInput = input
    
    // 1. Remove date phrase
    if (dateStringMatch) {
      cleanInput = cleanInput.replace(dateStringMatch, "")
    }

    // 2. Remove all matched mentions (words starting with @ that matched a node)
    words.forEach(word => {
      if (word.startsWith("@") && word.length > 1) {
        const search = word.substring(1).toLowerCase().replace(/[.,!?;:]$/, "")
        
        let isMatch = false
        if (nameIndex.has(search) && matchedNodes.has(nameIndex.get(search)!)) {
          isMatch = true
        } else {
          for (const [label, id] of nameIndex.entries()) {
            if (label.startsWith(search) && matchedNodes.has(id)) {
              isMatch = true
              break
            }
          }
        }
        
        if (isMatch) {
          cleanInput = cleanInput.replace(word, "")
        }
      }
    })

    // 3. Clean up remaining formatting (extra spaces, dangling connectors)
    cleanInput = cleanInput
      .replace(/\s+/g, " ")
      .replace(/\b(and|with|,)\s*$/i, "")
      .replace(/\s+(and|with)\s+/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      
    // Fallback if they just typed "@Alex" with no context
    if (!cleanInput) {
      cleanInput = "Interaction logged"
    }

    // Log interaction for every matched node using the cleaned input
    const nodes = useGraphStore.getState().nodes
    matchedNodes.forEach(id => {
      addInteraction(id, cleanInput, parsedDate)
      
      // Update lastContacted
      const node = nodes.find(n => n.id === id)
      if (node) {
        const data = node.data as Record<string, unknown>
        const currentLastContacted = data.lastContacted ? new Date(data.lastContacted as string).getTime() : 0
        const newTime = new Date(parsedDate).getTime()
        
        if (newTime >= currentLastContacted) {
          setNodes(nodes.map(n => 
            n.id === id ? { ...n, data: { ...n.data, lastContacted: new Date(parsedDate).toISOString() } } : n
          ))
        }
      }
    })

    setInput("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl top-[20%] p-0 gap-0 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] bg-white/5 backdrop-blur-3xl overflow-hidden rounded-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Command Bar</DialogTitle>
        <form onSubmit={handleSubmit} className="relative flex flex-col" autoComplete="off" data-bwignore data-1p-ignore data-lpignore="true">
          <div className="relative p-6">
            {/* The transparent input taking the actual keystrokes */}
            <input
              type="search"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Log interaction... e.g. 'Coffee with @Alex on friday'"
              className="w-full text-xl bg-transparent outline-none z-10 relative placeholder:text-white/20 caret-primary text-transparent"
              spellCheck={false}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              data-form-type="other"
              maxLength={2000}
            />
            {/* The styled overlay sitting perfectly beneath the text */}
            <div className="absolute top-6 left-6 right-6 text-xl pointer-events-none whitespace-pre-wrap break-words text-white" aria-hidden="true">
              {!input ? null : renderedText}
            </div>
          </div>
          
          {input && (
            <div className="border-t border-white/10 bg-white/5 p-4 text-xs flex gap-6 text-white/50">
              <div>
                <span className="font-semibold text-white/80">Linking to: </span>
                {matchedNodes.size > 0 
                  ? <span className="text-primary">{Array.from(matchedNodes).map(id => useGraphStore.getState().nodes.find(n => n.id === id)?.data.label).join(", ")}</span>
                  : "None (type @name)"}
              </div>
              <div>
                <span className="font-semibold text-white/80">Date: </span>
                <span className="text-amber-500">{parsedDate}</span>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
