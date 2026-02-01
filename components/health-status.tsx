'use client'

import React, { useEffect, useState } from 'react'
import { useStream } from './stream-provider'

interface HealthData {
  ok: boolean
  now: string
  counts: {
    total: number
    active: number
  }
  lastPoll?: {
    fetched_at: string
    internal_count: number
    external_count: number
    new_events: number
    updated_events: number
    removed_events: number
    detail_updates: number
    errors?: string
  }
}

export function HealthStatus() {
  const { health } = useStream()
  const [healthData, setHealthData] = useState<HealthData | null>(null)

  useEffect(() => {
    setHealthData(health as HealthData)
  }, [health])

  if (!healthData) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading health status...</p>
        </div>
      </div>
    )
  }

  const lastPoll = healthData.lastPoll
  const lastPollTime = lastPoll?.fetched_at ? new Date(lastPoll.fetched_at) : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric">
          <p className="text-xs text-muted-foreground mb-1">Total Events</p>
          <p className="text-3xl font-bold text-primary">{healthData.counts.total}</p>
          <p className="text-xs text-muted-foreground mt-1">in database</p>
        </div>

        <div className="metric">
          <p className="text-xs text-muted-foreground mb-1">Active Events</p>
          <p className="text-3xl font-bold text-accent">{healthData.counts.active}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {((healthData.counts.active / healthData.counts.total) * 100).toFixed(1)}% of total
          </p>
        </div>

        {lastPoll && (
          <>
            <div className="metric">
              <p className="text-xs text-muted-foreground mb-1">Internal Events</p>
              <p className="text-3xl font-bold text-blue-400">{lastPoll.internal_count}</p>
              <p className="text-xs text-muted-foreground mt-1">last poll</p>
            </div>

            <div className="metric">
              <p className="text-xs text-muted-foreground mb-1">External Events</p>
              <p className="text-3xl font-bold text-purple-400">{lastPoll.external_count}</p>
              <p className="text-xs text-muted-foreground mt-1">last poll</p>
            </div>
          </>
        )}
      </div>

      {lastPoll && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Last Poll</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {lastPollTime ? lastPollTime.toLocaleString() : 'Unknown'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">New Events</p>
              <p className="text-2xl font-bold text-green-400">{lastPoll.new_events}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Updated</p>
              <p className="text-2xl font-bold text-blue-400">{lastPoll.updated_events}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Removed</p>
              <p className="text-2xl font-bold text-red-400">{lastPoll.removed_events}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Detail Updates</p>
              <p className="text-2xl font-bold text-amber-400">{lastPoll.detail_updates}</p>
            </div>
          </div>

          {lastPoll.errors && (
            <div className="mt-4 p-3 rounded bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 font-mono">{lastPoll.errors}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
