"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useGraphStore } from "@/stores/graph-store"
import { UploadCloud, FileText } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportCsvDialog({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const setNodes = useGraphStore((s) => s.setNodes)
  const setEdges = useGraphStore((s) => s.setEdges)

  function processCsv(text: string) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return // Need header + at least 1 row
    
    // Naive CSV parsing - won't handle commas inside quotes perfectly, but sufficient for simple data
    const headers = lines[0].toLowerCase().split(",").map(h => h.trim())
    
    const nameIdx = headers.findIndex(h => h.includes("name"))
    const emailIdx = headers.findIndex(h => h.includes("email"))
    const phoneIdx = headers.findIndex(h => h.includes("phone"))
    const circleIdx = headers.findIndex(h => h.includes("circle") || h.includes("cluster") || h.includes("group"))
    
    if (nameIdx === -1) {
      alert("CSV must contain a 'Name' column.")
      return
    }

    const currentNodes = [...useGraphStore.getState().nodes]
    const currentEdges = [...useGraphStore.getState().edges]
    
    // Keep track of new circles to avoid duplicates
    const circleMap = new Map<string, string>() // Name -> ID
    
    currentNodes.filter(n => n.type === "cluster").forEach(c => {
      circleMap.set(String(c.data.label).toLowerCase(), c.id)
    })

    for (let i = 1; i < lines.length; i++) {
      // Split by comma but respect quotes (basic regex)
      const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
      const cols = matches.map(m => m.replace(/^"|"$/g, "").trim())
      
      const name = cols[nameIdx]
      if (!name) continue
      
      const email = emailIdx !== -1 ? cols[emailIdx] : null
      const phone = phoneIdx !== -1 ? cols[phoneIdx] : null
      const circleName = circleIdx !== -1 ? cols[circleIdx] : null

      const personId = `p-csv-${Date.now()}-${i}`
      
      currentNodes.push({
        id: personId,
        type: "person",
        position: { x: Math.random() * 600, y: Math.random() * 400 },
        data: { label: name, email, phone }
      })

      if (circleName) {
        const cKey = circleName.toLowerCase()
        let cId = circleMap.get(cKey)
        if (!cId) {
          cId = `c-csv-${Date.now()}-${i}`
          circleMap.set(cKey, cId)
          currentNodes.push({
            id: cId,
            type: "cluster",
            position: { x: Math.random() * 600, y: Math.random() * 400 },
            data: { label: circleName }
          })
        }
        currentEdges.push({
          id: `e-csv-${Date.now()}-${i}`,
          source: personId,
          target: cId
        })
      }
    }

    setNodes(currentNodes)
    setEdges(currentEdges)
    onOpenChange(false)
    setFile(null)
  }

  async function handleImport() {
    if (!file) return
    setIsProcessing(true)
    try {
      const text = await file.text()
      processCsv(text)
    } catch (e) {
      console.error(e)
      alert("Failed to read file.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white/90">Import CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm text-white/60">
            Upload a CSV file containing your contacts. It must include a <strong>Name</strong> column. 
            Optional columns: <strong>Email</strong>, <strong>Phone</strong>, <strong>Circle</strong>.
          </div>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all text-white/60 hover:text-white/90"
          >
            {file ? <FileText size={32} className="text-primary" /> : <UploadCloud size={32} />}
            <span className="text-sm font-medium text-center">
              {file ? file.name : "Click to select a CSV file"}
            </span>
          </div>
          
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0])
            }}
          />

          <Button 
            className="w-full" 
            disabled={!file || isProcessing}
            onClick={handleImport}
          >
            {isProcessing ? "Importing..." : "Import Contacts"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
