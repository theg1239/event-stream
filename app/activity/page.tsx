"use client"

import { Navigation } from "@/components/navigation"
import { ActivityFeed } from "@/components/activity-feed"
import { useEventStream } from "@/hooks/use-stream"
import { Activity, Radio, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ActivityPage() {
  const stream = useEventStream()

  return (
    <div className="min-h-screen gradient-mesh">
      <Navigation connected={stream.connected} />

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Live Activity</h1>
            <p className="text-muted-foreground mt-1">
              Real-time stream of all event changes
            </p>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border",
              stream.connected
                ? "border-primary/30 bg-primary/10"
                : "border-destructive/30 bg-destructive/10"
            )}
          >
            {stream.connected ? (
              <>
                <div className="relative">
                  <Radio className="h-4 w-4 text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary live-pulse" />
                </div>
                <span className="text-sm text-primary font-medium">
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  Disconnected
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stream Status */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Activity Count</span>
            </div>
            <p className="text-3xl font-semibold">
              {stream.recentActivity.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">events in session</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Ping</span>
            </div>
            <p className="text-3xl font-semibold font-mono">
              {stream.lastPing
                ? new Date(stream.lastPing).toLocaleTimeString()
                : "--:--:--"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">server heartbeat</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Stream Status</span>
            </div>
            <p
              className={cn(
                "text-3xl font-semibold",
                stream.connected ? "text-primary" : "text-destructive"
              )}
            >
              {stream.connected ? "Live" : "Offline"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stream.error || "SSE connection active"}
            </p>
          </div>
        </div>

        {/* Poll Summary */}
        {stream.pollSummary && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">Latest Poll Summary</span>
              <span className="text-xs text-muted-foreground">
                {new Date(stream.pollSummary.fetchedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-semibold text-primary">
                  {stream.pollSummary.newEvents}
                </p>
                <p className="text-xs text-muted-foreground">New Events</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-accent">
                  {stream.pollSummary.updatedEvents}
                </p>
                <p className="text-xs text-muted-foreground">Updated</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-destructive">
                  {stream.pollSummary.removedEvents}
                </p>
                <p className="text-xs text-muted-foreground">Removed</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-chart-5">
                  {stream.pollSummary.detailUpdates}
                </p>
                <p className="text-xs text-muted-foreground">Detail Updates</p>
              </div>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Activity Stream</h2>
            </div>
            {stream.recentActivity.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {stream.recentActivity.length} events
              </span>
            )}
          </div>

          {stream.connected ? (
            <ActivityFeed items={stream.recentActivity} maxItems={100} />
          ) : (
            <div className="py-12 text-center">
              <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Connecting to event stream...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Activity will appear here once connected
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
