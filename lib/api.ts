// API client for the event stream service

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export interface HealthResponse {
  ok: boolean
  now: string
  counts: {
    total: number
    active: number
  }
  lastPoll: PollRun | null
}

export interface PollRun {
  id: number
  fetched_at: string
  internal_count: number
  external_count: number
  new_events: number
  updated_events: number
  removed_events: number
  detail_updates: number
  errors: string | null
}

export interface EventRecord {
  id: number
  event_code: string
  event_type: "internal" | "external"
  name: string
  category: string
  club: string
  short_description: string
  start_date: string
  end_date: string
  price_per_ticket: number
  team_size: string
  venues: string[]
  image: string
  featured: boolean
  on_hold: boolean
  is_registrable: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  raw_json: Record<string, unknown>
}

export interface EventDetail {
  id: number
  event_code: string
  event_type: string
  name: string
  category: string
  club: string
  long_description_md: string
  short_description: string
  rules: string
  prizes: string
  judgement_criteria: string
  coordinator1_email: string
  coordinator1_phone: string
  is_a_team_event: boolean
  number_of_participants: string
  price_per_ticket: number
  slot_details: Array<{
    start_date: string
    end_date: string
    venue: string
  }>
  image: string
  created_at: string
  updated_at: string
}

export interface EventChange {
  id: number
  event_code: string
  event_type: "internal" | "external"
  entity_type: "event_list" | "event_detail"
  change_kind: "insert" | "update" | "remove"
  fetched_at: string
  event_name: string | null
  category: string | null
  club: string | null
  price_per_ticket: number | null
  start_date: string | null
  end_date: string | null
  venues: string[] | null
  hash_before: string | null
  hash_after: string | null
  data_before: Record<string, unknown> | null
  data_after: Record<string, unknown> | null
  diff: Array<{ key: string; before: unknown; after: unknown }>
}

export interface DailyRollup {
  day: string
  event_type: "internal" | "external"
  entity_type: "event_list" | "event_detail"
  change_kind: "insert" | "update" | "remove"
  count: number
}

export interface EventsResponse {
  items: EventRecord[]
  limit: number
  offset: number
  count: number
}

export interface ChangesResponse {
  items: EventChange[]
  limit: number
  offset: number
  count: number
}

export interface RollupsResponse {
  items: DailyRollup[]
  count: number
}

export interface Snapshot {
  counts: {
    total: number
    active: number
  }
  lastPoll: PollRun | null
  recent: EventRecord[]
}

export interface SSEMessage {
  event: string
  data: unknown
}

// Fetch functions
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error("Failed to fetch health")
  return res.json()
}

export async function fetchEvents(params: {
  type?: "internal" | "external"
  active?: boolean
  limit?: number
  offset?: number
  q?: string
}): Promise<EventsResponse> {
  const searchParams = new URLSearchParams()
  if (params.type) searchParams.set("type", params.type)
  if (params.active !== undefined) searchParams.set("active", String(params.active))
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.offset) searchParams.set("offset", String(params.offset))
  if (params.q) searchParams.set("q", params.q)
  
  const res = await fetch(`${API_BASE}/events?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch events")
  return res.json()
}

export async function fetchEventDetail(eventCode: string, type?: "internal" | "external"): Promise<{
  event: EventRecord
  detail: EventDetail | null
}> {
  const searchParams = new URLSearchParams()
  if (type) searchParams.set("type", type)
  
  const res = await fetch(`${API_BASE}/events/${eventCode}?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch event detail")
  return res.json()
}

export async function fetchChanges(params: {
  event_code?: string
  event_type?: "internal" | "external"
  entity?: "event_list" | "event_detail"
  kind?: "insert" | "update" | "remove"
  from?: string
  to?: string
  limit?: number
  offset?: number
}): Promise<ChangesResponse> {
  const searchParams = new URLSearchParams()
  if (params.event_code) searchParams.set("event_code", params.event_code)
  if (params.event_type) searchParams.set("event_type", params.event_type)
  if (params.entity) searchParams.set("entity", params.entity)
  if (params.kind) searchParams.set("kind", params.kind)
  if (params.from) searchParams.set("from", params.from)
  if (params.to) searchParams.set("to", params.to)
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.offset) searchParams.set("offset", String(params.offset))
  
  const res = await fetch(`${API_BASE}/changes?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch changes")
  return res.json()
}

export async function fetchRollups(params: {
  event_type?: "internal" | "external"
  entity?: "event_list" | "event_detail"
  kind?: "insert" | "update" | "remove"
  from?: string
  to?: string
}): Promise<RollupsResponse> {
  const searchParams = new URLSearchParams()
  if (params.event_type) searchParams.set("event_type", params.event_type)
  if (params.entity) searchParams.set("entity", params.entity)
  if (params.kind) searchParams.set("kind", params.kind)
  if (params.from) searchParams.set("from", params.from)
  if (params.to) searchParams.set("to", params.to)
  
  const res = await fetch(`${API_BASE}/rollups/daily?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch rollups")
  return res.json()
}

export async function triggerPoll(): Promise<{ status: string; result: unknown }> {
  const res = await fetch(`${API_BASE}/poll`)
  if (!res.ok) throw new Error("Failed to trigger poll")
  return res.json()
}

// SSE Stream connection
export function createEventStream(
  onMessage: (event: string, data: unknown) => void,
  onError?: (error: Error) => void,
  onOpen?: () => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/stream`)
  
  eventSource.onopen = () => {
    onOpen?.()
  }
  
  eventSource.onerror = (e) => {
    onError?.(new Error("Stream connection error"))
  }
  
  // Listen for specific events
  const events = [
    "ready",
    "snapshot",
    "snapshot_error",
    "event_upsert",
    "event_removed",
    "event_detail_upsert",
    "poll_summary",
    "ping"
  ]
  
  for (const eventType of events) {
    eventSource.addEventListener(eventType, (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data)
        onMessage(eventType, data)
      } catch {
        onMessage(eventType, (e as MessageEvent).data)
      }
    })
  }
  
  // Return cleanup function
  return () => {
    eventSource.close()
  }
}
