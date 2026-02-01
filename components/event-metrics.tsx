'use client'

import React, { useEffect, useState } from 'react'
import { useStream } from './stream-provider'

interface EventMetricsData {
  type: string
  count: number
  lastUpdate: string
}

export function EventMetrics({ showAll = false }: { showAll?: boolean }) {
  const { events } = useStream()
  const [metrics, setMetrics] = useState<Map<string, EventMetricsData>>(new Map())

  useEffect(() => {
    const newMetrics = new Map<string, EventMetricsData>()

    events.forEach((event) => {
      if (event.type === 'poll_summary') {
        const data = event.data as any
        const key = `poll_${event.timestamp}`
        newMetrics.set(key, {
          type: 'Poll Summary',
          count: (data.newEvents || 0) + (data.updatedEvents || 0) + (data.removedEvents || 0),
          lastUpdate: event.timestamp,
        })
      } else if (event.type === 'event_upsert') {
        const key = `upsert_${event.timestamp}`
        newMetrics.set(key, {
          type: 'Event Upsert',
          count: 1,
          lastUpdate: event.timestamp,
        })
      } else if (event.type === 'event_removed') {
        const key = `remove_${event.timestamp}`
        newMetrics.set(key, {
          type: 'Event Removed',
          count: 1,
          lastUpdate: event.timestamp,
        })
      }
    })

    setMetrics(newMetrics)
  }, [events])

  const metricsArray = Array.from(metrics.values()).slice(0, showAll ? undefined : 5)
  const eventTypes = events.filter(e => e.type === 'poll_summary').slice(0, 3)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Event Activity</h3>
        <p className="text-xs text-muted-foreground mt-1">Real-time event stream metrics</p>
      </div>

      {eventTypes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">Waiting for events...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {eventTypes.map((event, idx) => {
            const data = event.data as any
            return (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-border">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Poll #{idx + 1}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>New: <span className="text-green-400 font-semibold">{data.newEvents || 0}</span></span>
                    <span>Updated: <span className="text-blue-400 font-semibold">{data.updatedEvents || 0}</span></span>
                    <span>Removed: <span className="text-red-400 font-semibold">{data.removedEvents || 0}</span></span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
