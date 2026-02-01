'use client'

import React, { useMemo } from 'react'
import { useStream } from './stream-provider'

export function LiveChanges({ limit = 10 }: { limit?: number }) {
  const { events } = useStream()

  const changeEvents = useMemo(() => {
    return events
      .filter((e) => e.type === 'event_upsert' || e.type === 'event_removed' || e.type === 'event_detail_upsert')
      .slice(0, limit)
  }, [events, limit])

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'event_upsert':
        return '⬆️'
      case 'event_removed':
        return '❌'
      case 'event_detail_upsert':
        return '📝'
      default:
        return '•'
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'event_upsert':
        return 'text-green-400'
      case 'event_removed':
        return 'text-red-400'
      case 'event_detail_upsert':
        return 'text-blue-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getChangeBadgeColor = (type: string) => {
    switch (type) {
      case 'event_upsert':
        return 'bg-green-500/10 border-green-500/30 text-green-400'
      case 'event_removed':
        return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'event_detail_upsert':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold">Live Changes</h3>
        <p className="text-xs text-muted-foreground mt-1">Recent event stream changes</p>
      </div>

      {changeEvents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No changes yet...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {changeEvents.map((event, idx) => {
            const data = event.data as Record<string, any>
            const eventName = data.name || data.event_code || 'Unknown'
            
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded bg-slate-900/50 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="text-lg flex-shrink-0 mt-0.5">{getChangeIcon(event.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getChangeBadgeColor(event.type)}`}>
                      {event.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground truncate">{eventName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
