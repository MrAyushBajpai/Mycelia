export type Cluster = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type Contact = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  avatar_url: string | null
  custom_dates: Record<string, string>
  cadence_days: number | null
  last_contacted_at: string | null
  created_at: string
}

export type Edge = {
  id: string
  user_id: string
  source_id: string
  target_id: string
  label: string
  created_at: string
}

export type Interaction = {
  id: string
  user_id: string
  contact_id: string
  note: string
  occurred_at: string
  created_at: string
}

export type ContactCluster = {
  contact_id: string
  cluster_id: string
}
