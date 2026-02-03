// SSE stream hook for real-time event updates
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createEventStream, type Snapshot } from "@/lib/api"

export interface StreamState {
  connected: boolean
  snapshot: Snapshot | null
  recentActivity: ActivityItem[]
  pollSummary: PollSummary | null
  lastPing: string | null
  error: string | null
}

export interface ActivityItem {
  id: string
  type: "event_upsert" | "event_removed" | "event_detail_upsert"
  eventCode: string
  eventType: "internal" | "external"
  action: "insert" | "update" | "remove"
  timestamp: string
  payload?: unknown
}

export interface PollSummary {
  fetchedAt: string
  internalCount: number
  externalCount: number
  newEvents: number
  updatedEvents: number
  removedEvents: number
  detailUpdates: number
  errors: string[]
}

export function useEventStream() {
  const [state, setState] = useState<StreamState>({
    connected: false,
    snapshot: null,
    recentActivity: [],
    pollSummary: null,
    lastPing: null,
    error: null,
  })
  
  const activityIdRef = useRef(0)

  const addActivity = useCallback((item: Omit<ActivityItem, "id">) => {
    setState(prev => ({
      ...prev,
      recentActivity: [
        { ...item, id: String(++activityIdRef.current) },
        ...prev.recentActivity.slice(0, 99)
      ]
    }))
  }, [])

  useEffect(() => {
    const cleanup = createEventStream(
      (event, data) => {
        switch (event) {
          case "ready":
            setState(prev => ({ ...prev, connected: true, error: null }))
            break
            
          case "snapshot":
            setState(prev => ({ ...prev, snapshot: data as Snapshot }))
            break
            
          case "snapshot_error":
            setState(prev => ({ 
              ...prev, 
              error: (data as { message: string }).message 
            }))
            break
            
          case "event_upsert": {
            const payload = data as { eventType: string; eventCode: string; action: string; payload?: unknown }
            addActivity({
              type: "event_upsert",
              eventCode: payload.eventCode,
              eventType: payload.eventType as "internal" | "external",
              action: payload.action as "insert" | "update",
              timestamp: new Date().toISOString(),
              payload: payload.payload,
            })
            break
          }
            
          case "event_removed": {
            const payload = data as { eventType: string; eventCode: string }
            addActivity({
              type: "event_removed",
              eventCode: payload.eventCode,
              eventType: payload.eventType as "internal" | "external",
              action: "remove",
              timestamp: new Date().toISOString(),
            })
            break
          }
            
          case "event_detail_upsert": {
            const payload = data as { eventType: string; eventCode: string; action: string; payload?: unknown }
            addActivity({
              type: "event_detail_upsert",
              eventCode: payload.eventCode,
              eventType: payload.eventType as "internal" | "external",
              action: payload.action as "insert" | "update",
              timestamp: new Date().toISOString(),
              payload: payload.payload,
            })
            break
          }
            
          case "poll_summary":
            setState(prev => ({ ...prev, pollSummary: data as PollSummary }))
            break
            
          case "ping":
            setState(prev => ({ ...prev, lastPing: (data as { ts: string }).ts }))
            break
        }
      },
      (error) => {
        setState(prev => ({ ...prev, connected: false, error: error.message }))
      },
      () => {
        setState(prev => ({ ...prev, connected: true, error: null }))
      }
    )

    return cleanup
  }, [addActivity])

  return state
}
