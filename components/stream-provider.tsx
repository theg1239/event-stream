'use client'

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react'

export interface StreamEvent {
  type: string
  data: unknown
  timestamp: string
}

interface StreamContextType {
  events: StreamEvent[]
  health: unknown
  isConnected: boolean
}

const StreamContext = createContext<StreamContextType | undefined>(undefined)

export function StreamProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = React.useState<StreamEvent[]>([])
  const [health, setHealth] = React.useState(null)
  const [isConnected, setIsConnected] = React.useState(false)
  const eventBufferRef = useRef<StreamEvent[]>([])
  const maxEventsRef = useRef(100)

  useEffect(() => {
    const connectStream = () => {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'
      const eventSource = new EventSource(`${serverUrl}/stream?snapshot=true&limit=25`)

      eventSource.addEventListener('ready', () => {
        setIsConnected(true)
        console.log('[stream] Connected')
      })

      eventSource.addEventListener('snapshot', (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[stream] Received snapshot', data)
          // Snapshot contains initial state
        } catch (e) {
          console.error('[stream] Failed to parse snapshot', e)
        }
      })

      eventSource.addEventListener('event_upsert', (event) => {
        try {
          const data = JSON.parse(event.data)
          addEvent('event_upsert', data)
        } catch (e) {
          console.error('[stream] Failed to parse event_upsert', e)
        }
      })

      eventSource.addEventListener('event_removed', (event) => {
        try {
          const data = JSON.parse(event.data)
          addEvent('event_removed', data)
        } catch (e) {
          console.error('[stream] Failed to parse event_removed', e)
        }
      })

      eventSource.addEventListener('event_detail_upsert', (event) => {
        try {
          const data = JSON.parse(event.data)
          addEvent('event_detail_upsert', data)
        } catch (e) {
          console.error('[stream] Failed to parse event_detail_upsert', e)
        }
      })

      eventSource.addEventListener('poll_summary', (event) => {
        try {
          const data = JSON.parse(event.data)
          addEvent('poll_summary', data)
        } catch (e) {
          console.error('[stream] Failed to parse poll_summary', e)
        }
      })

      eventSource.addEventListener('ping', () => {
        // Keep alive
      })

      eventSource.addEventListener('error', () => {
        console.error('[stream] Connection error')
        setIsConnected(false)
        eventSource.close()
        // Reconnect after 3 seconds
        setTimeout(connectStream, 3000)
      })

      return eventSource
    }

    const addEvent = (type: string, data: unknown) => {
      const newEvent: StreamEvent = {
        type,
        data,
        timestamp: new Date().toISOString(),
      }
      eventBufferRef.current.unshift(newEvent)
      if (eventBufferRef.current.length > maxEventsRef.current) {
        eventBufferRef.current.pop()
      }
      setEvents([...eventBufferRef.current])
    }

    const eventSource = connectStream()

    // Fetch health status
    const fetchHealth = async () => {
      try {
        const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'
        const response = await fetch(`${serverUrl}/health`)
        if (response.ok) {
          const data = await response.json()
          setHealth(data)
        }
      } catch (e) {
        console.error('[stream] Failed to fetch health', e)
      }
    }

    fetchHealth()
    const healthInterval = setInterval(fetchHealth, 10000)

    return () => {
      eventSource.close()
      clearInterval(healthInterval)
    }
  }, [])

  return (
    <StreamContext.Provider value={{ events, health, isConnected }}>
      {children}
    </StreamContext.Provider>
  )
}

export function useStream() {
  const context = useContext(StreamContext)
  if (context === undefined) {
    throw new Error('useStream must be used within StreamProvider')
  }
  return context
}
