'use client'

import React from 'react'

interface Route {
  path: string
  method: string
  description: string
  params?: string[]
  example?: string
}

const routes: Route[] = [
  {
    path: '/stream',
    method: 'GET',
    description: 'Server-Sent Events stream for real-time updates',
    params: ['snapshot=true|false', 'limit=1-200'],
    example: '/stream?snapshot=true&limit=25',
  },
  {
    path: '/health',
    method: 'GET',
    description: 'Health check and current system status',
    example: '/health',
  },
  {
    path: '/poll',
    method: 'GET',
    description: 'Trigger or check current poll status',
    example: '/poll',
  },
  {
    path: '/events',
    method: 'GET',
    description: 'Fetch events with filtering and pagination',
    params: ['type=internal|external', 'active=true|false', 'limit=1-200', 'offset=0+', 'q=search'],
    example: '/events?type=internal&active=true&limit=50',
  },
  {
    path: '/events/:code',
    method: 'GET',
    description: 'Fetch specific event with details',
    params: ['type=internal|external'],
    example: '/events/evt_12345?type=internal',
  },
  {
    path: '/changes',
    method: 'GET',
    description: 'List event changes with filtering',
    params: [
      'event_type=internal|external',
      'event_code=string',
      'entity=event_list|event_detail',
      'kind=insert|update|remove',
      'from=ISO8601',
      'to=ISO8601',
      'limit=1-200',
      'offset=0+',
    ],
    example: '/changes?entity=event_list&kind=insert&limit=50',
  },
  {
    path: '/changes.jsonl',
    method: 'GET',
    description: 'Stream changes as NDJSON with cursor pagination',
    params: ['batch=100-5000', 'cursor=timestamp|id', '... (same as /changes)'],
    example: '/changes.jsonl?entity=event_list&batch=1000',
  },
  {
    path: '/rollups/daily',
    method: 'GET',
    description: 'Daily aggregated change statistics',
    params: [
      'event_type=internal|external',
      'entity=event_list|event_detail',
      'kind=insert|update|remove',
      'from=ISO8601',
      'to=ISO8601',
    ],
    example: '/rollups/daily?entity=event_list',
  },
]

export function RoutesList() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold mb-2">API Routes</h2>
        <p className="text-muted-foreground mb-6">Complete list of available endpoints</p>
      </div>

      <div className="space-y-4">
        {routes.map((route, idx) => (
          <div key={idx} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-2 py-1 rounded text-xs font-mono font-bold bg-primary/20 text-primary border border-primary/30">
                    {route.method}
                  </span>
                  <code className="text-sm font-mono text-foreground">{route.path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{route.description}</p>
              </div>
            </div>

            {route.params && route.params.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Parameters:</p>
                <div className="flex flex-wrap gap-2">
                  {route.params.map((param, i) => (
                    <span key={i} className="inline-block px-2 py-1 rounded text-xs bg-slate-900/50 border border-border text-muted-foreground font-mono">
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {route.example && (
              <div className="bg-slate-950/50 rounded p-2 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Example:</p>
                <code className="text-xs font-mono text-accent break-all">{route.example}</code>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
