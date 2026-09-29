"use client"

import { useState } from "react"
import { Plus, Users, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddPersonDialog } from "@/components/dialogs/add-person"
import { AddClusterDialog } from "@/components/dialogs/add-cluster"

export function Toolbar() {
  const [personOpen, setPersonOpen] = useState(false)
  const [clusterOpen, setClusterOpen] = useState(false)

  return (
    <>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setPersonOpen(true)}>
          <User size={14} data-icon="inline-start" />
          Add Person
        </Button>
        <Button variant="outline" size="sm" onClick={() => setClusterOpen(true)}>
          <Users size={14} data-icon="inline-start" />
          Add Circle
        </Button>
      </div>

      <AddPersonDialog open={personOpen} onOpenChange={setPersonOpen} />
      <AddClusterDialog open={clusterOpen} onOpenChange={setClusterOpen} />
    </>
  )
}
