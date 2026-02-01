'use client'

import React from 'react'
import { useStream } from './stream-provider'

interface HeaderProps {
  activeTab: 'overview' | 'routes' | 'changes' | 'events'
  setActiveTab: (tab: 'overview' | 'routes' | 'changes' | 'events') => void
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { isConnected } = useStream()

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'routes', label: 'Routes' },
    { id: 'changes', label: 'Changes' },
    { id: 'events', label: 'Events' },
  ] as const

  return (
    <header className="border-b border-border bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <div className="w-5 h-5 rounded bg-primary/40"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Event Stream</h1>
              <p className="text-xs text-muted-foreground">Real-time monitoring dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}
              ></div>
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-900/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
