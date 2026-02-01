'use client'

import React, { useState } from 'react'
import { useStream } from './stream-provider'
import { Header } from './header'
import { RoutesList } from './routes-list'
import { EventMetrics } from './event-metrics'
import { LiveChanges } from './live-changes'
import { HealthStatus } from './health-status'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'changes' | 'events'>('overview')

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <HealthStatus />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EventMetrics />
              <LiveChanges limit={10} />
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <RoutesList />
        )}

        {activeTab === 'changes' && (
          <LiveChanges limit={50} />
        )}

        {activeTab === 'events' && (
          <EventMetrics showAll={true} />
        )}
      </main>
    </div>
  )
}
