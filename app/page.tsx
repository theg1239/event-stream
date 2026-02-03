"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Navigation } from "@/components/navigation"
import { StatsCard } from "@/components/stats-card"
import { ActivityFeed } from "@/components/activity-feed"
import { DailyChart } from "@/components/daily-chart"
import { EventTable } from "@/components/event-table"
import { PollStatus } from "@/components/poll-status"
import { useEventStream } from "@/hooks/use-stream"
import {
  fetchHealth,
  fetchRollups,
  fetchEvents,
  fetchChanges,
  triggerPoll,
  type HealthResponse,
  type RollupsResponse,
  type EventsResponse,
  type ChangesResponse,
} from "@/lib/api"
import {
  Activity,
  BarChart3,
  Calendar,
  GitCommit,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const stream = useEventStream()
  const [isPolling, setIsPolling] = useState(false)

  const { data: health, mutate: mutateHealth } = useSWR<HealthResponse>(
    "health",
    fetchHealth,
    { refreshInterval: 30000 }
  )

  const { data: rollups } = useSWR<RollupsResponse>(
    "rollups",
    () => fetchRollups({}),
    { refreshInterval: 60000 }
  )

  const { data: recentEvents } = useSWR<EventsResponse>(
    "recent-events",
    () => fetchEvents({ limit: 10 }),
    { refreshInterval: 30000 }
  )

  const { data: recentChanges } = useSWR<ChangesResponse>(
    "recent-changes",
    () => fetchChanges({ limit: 20 }),
    { refreshInterval: 30000 }
  )

  const stats = {
    totalInserts: rollups?.items.filter(r => r.change_kind === "insert").reduce((acc, r) => acc + Number(r.count), 0) ?? 0,
    totalUpdates: rollups?.items.filter(r => r.change_kind === "update").reduce((acc, r) => acc + Number(r.count), 0) ?? 0,
    totalRemoves: rollups?.items.filter(r => r.change_kind === "remove").reduce((acc, r) => acc + Number(r.count), 0) ?? 0,
  }

  const handlePoll = useCallback(async () => {
    setIsPolling(true)
    try {
      await triggerPoll()
      await mutateHealth()
    } catch (error) {
      console.error("Poll failed:", error)
    } finally {
      setIsPolling(false)
    }
  }, [mutateHealth])

  const counts = stream.snapshot?.counts ?? health?.counts
  const lastPoll = stream.snapshot?.lastPoll ?? health?.lastPoll

  return (
    <div className="min-h-screen gradient-mesh">
      <Navigation connected={stream.connected} />

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Real-time event monitoring and analytics
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
          <StatsCard
            title="Active Events"
            value={counts?.active ?? 0}
            icon={Calendar}
            trendLabel="currently tracked"
          />
          <StatsCard
            title="Total Inserts"
            value={stats.totalInserts}
            icon={Plus}
            valueClassName="text-primary"
            trendLabel="all time"
          />
          <StatsCard
            title="Total Updates"
            value={stats.totalUpdates}
            icon={RefreshCw}
            valueClassName="text-accent"
            trendLabel="all time"
          />
          <StatsCard
            title="Total Removes"
            value={stats.totalRemoves}
            icon={Trash2}
            valueClassName="text-destructive"
            trendLabel="all time"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-medium">Activity Over Time</h2>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-chart-1" />
                    <span className="text-muted-foreground">Inserts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-chart-2" />
                    <span className="text-muted-foreground">Updates</span>
                  </div>
                </div>
              </div>
              <DailyChart data={rollups?.items ?? []} days={14} />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-medium">Recent Events</h2>
                </div>
                <Link
                  href="/events"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <EventTable
                events={stream.snapshot?.recent ?? recentEvents?.items ?? []}
                compact
              />
            </div>

            <PollStatus
              lastPoll={lastPoll}
              liveSummary={stream.pollSummary}
              onTriggerPoll={handlePoll}
              isPolling={isPolling}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-medium">Live Activity</h2>
                </div>
                <Link
                  href="/activity"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <ActivityFeed
                items={stream.recentActivity}
                maxItems={15}
              />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-medium">Event Types</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Internal</span>
                  <span className="font-medium text-primary">
                    {stream.pollSummary?.internalCount ?? lastPoll?.internal_count ?? 0}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((stream.pollSummary?.internalCount ?? lastPoll?.internal_count ?? 0) /
                          Math.max(
                            (stream.pollSummary?.internalCount ?? lastPoll?.internal_count ?? 0) +
                              (stream.pollSummary?.externalCount ?? lastPoll?.external_count ?? 0),
                            1
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">External</span>
                  <span className="font-medium text-accent">
                    {stream.pollSummary?.externalCount ?? lastPoll?.external_count ?? 0}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((stream.pollSummary?.externalCount ?? lastPoll?.external_count ?? 0) /
                          Math.max(
                            (stream.pollSummary?.internalCount ?? lastPoll?.internal_count ?? 0) +
                              (stream.pollSummary?.externalCount ?? lastPoll?.external_count ?? 0),
                            1
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-medium">Recent Changes</h2>
                </div>
                <Link
                  href="/changes"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {(recentChanges?.items ?? []).slice(0, 5).map((change) => (
                  <div
                    key={change.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          change.change_kind === "insert"
                            ? "bg-primary"
                            : change.change_kind === "update"
                            ? "bg-accent"
                            : "bg-destructive"
                        }`}
                      />
                      <span className="truncate font-mono text-xs">
                        {change.event_name || change.event_code}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {change.change_kind}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
