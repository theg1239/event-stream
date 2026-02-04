"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Navigation } from "@/components/navigation"
import { ChangesTimeline } from "@/components/changes-timeline"
import { DailyChart } from "@/components/daily-chart"
import { FilterPanel } from "@/components/filter-panel"
import { useEventStream } from "@/hooks/use-stream"
import {
  fetchChanges,
  fetchRollups,
  type ChangesResponse,
  type RollupsResponse,
} from "@/lib/api"
import { BarChart3, ChevronLeft, ChevronRight, GitCommit, Plus, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ChangesPage() {
  const stream = useEventStream()
  const [filters, setFilters] = useState({
    event_type: undefined as "internal" | "external" | undefined,
    entity: undefined as "event_list" | "event_detail" | undefined,
    kind: undefined as "insert" | "update" | "remove" | undefined,
    limit: 50,
    offset: 0,
  })

  const { data: changes, isLoading } = useSWR<ChangesResponse>(
    ["changes", filters],
    () =>
      fetchChanges({
        event_type: filters.event_type,
        entity: filters.entity,
        kind: filters.kind,
        limit: filters.limit,
        offset: filters.offset,
      }),
    { refreshInterval: 30000 }
  )

  const { data: rollups } = useSWR<RollupsResponse>(
    ["rollups-changes", filters.event_type, filters.entity, filters.kind],
    () =>
      fetchRollups({
        event_type: filters.event_type,
        entity: filters.entity,
        kind: filters.kind,
      }),
    { refreshInterval: 60000 }
  )

  const handleNextPage = useCallback(() => {
    setFilters((f) => ({ ...f, offset: f.offset + f.limit }))
  }, [])

  const handlePrevPage = useCallback(() => {
    setFilters((f) => ({ ...f, offset: Math.max(0, f.offset - f.limit) }))
  }, [])

  const changeItems = changes?.items ?? []
  const hasMore = changeItems.length === filters.limit
  const currentPage = Math.floor(filters.offset / filters.limit) + 1

  const stats = {
    inserts: rollups?.items.filter((r) => r.change_kind === "insert").reduce((acc, r) => acc + Number(r.count), 0) ?? 0,
    updates: rollups?.items.filter((r) => r.change_kind === "update").reduce((acc, r) => acc + Number(r.count), 0) ?? 0,
    removes: rollups?.items.filter((r) => r.change_kind === "remove").reduce((acc, r) => acc + Number(r.count), 0) ?? 0,
  }
  const total = stats.inserts + stats.updates + stats.removes

  return (
    <div className="min-h-screen gradient-mesh">
      <Navigation connected={stream.connected} />

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Change History</h1>
          <p className="text-muted-foreground mt-1">
            Track all modifications to events over time
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() =>
              setFilters((f) => ({
                ...f,
                kind: f.kind === "insert" ? undefined : "insert",
                offset: 0,
              }))
            }
            className={cn(
              "rounded-lg border p-4 text-center transition-colors",
              filters.kind === "insert"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-2xl font-semibold text-primary">
                {stats.inserts.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Inserts</p>
            <div className="mt-2 h-1 rounded-full bg-secondary">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${total ? (stats.inserts / total) * 100 : 0}%` }}
              />
            </div>
          </button>

          <button
            onClick={() =>
              setFilters((f) => ({
                ...f,
                kind: f.kind === "update" ? undefined : "update",
                offset: 0,
              }))
            }
            className={cn(
              "rounded-lg border p-4 text-center transition-colors",
              filters.kind === "update"
                ? "border-accent bg-accent/10"
                : "border-border bg-card hover:border-accent/50"
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <RefreshCw className="h-5 w-5 text-accent" />
              <span className="text-2xl font-semibold text-accent">
                {stats.updates.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Updates</p>
            <div className="mt-2 h-1 rounded-full bg-secondary">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${total ? (stats.updates / total) * 100 : 0}%` }}
              />
            </div>
          </button>

          <button
            onClick={() =>
              setFilters((f) => ({
                ...f,
                kind: f.kind === "remove" ? undefined : "remove",
                offset: 0,
              }))
            }
            className={cn(
              "rounded-lg border p-4 text-center transition-colors",
              filters.kind === "remove"
                ? "border-destructive bg-destructive/10"
                : "border-border bg-card hover:border-destructive/50"
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-semibold text-destructive">
                {stats.removes.toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Removes</p>
            <div className="mt-2 h-1 rounded-full bg-secondary">
              <div
                className="h-full bg-destructive rounded-full"
                style={{ width: `${total ? (stats.removes / total) * 100 : 0}%` }}
              />
            </div>
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-medium">Daily Activity</h2>
          </div>
          <DailyChart data={rollups?.items ?? []} days={14} variant="bar" />
        </div>

        <div className="mb-6">
          <FilterPanel
            filters={[
              {
                key: "event_type",
                label: "All Types",
                value: filters.event_type,
                options: [
                  { value: "internal", label: "Internal" },
                  { value: "external", label: "External" },
                ],
                onChange: (type) =>
                  setFilters((f) => ({
                    ...f,
                    event_type: type as "internal" | "external" | undefined,
                    offset: 0,
                  })),
              },
              {
                key: "entity",
                label: "All Entities",
                value: filters.entity,
                options: [
                  { value: "event_list", label: "Event List" },
                  { value: "event_detail", label: "Event Detail" },
                ],
                onChange: (entity) =>
                  setFilters((f) => ({
                    ...f,
                    entity: entity as "event_list" | "event_detail" | undefined,
                    offset: 0,
                  })),
              },
            ]}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <GitCommit className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-medium">Timeline</h2>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading changes...
            </div>
          ) : (
            <ChangesTimeline changes={changeItems} showDiffs />
          )}

          {changeItems.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filters.offset + 1} to{" "}
                {filters.offset + changeItems.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={filters.offset === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
