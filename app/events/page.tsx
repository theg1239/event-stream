"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Navigation } from "@/components/navigation"
import { EventTable } from "@/components/event-table"
import { FilterPanel } from "@/components/filter-panel"
import { useEventStream } from "@/hooks/use-stream"
import { fetchEvents, type EventsResponse } from "@/lib/api"
import { Calendar, ChevronLeft, ChevronRight, Grid3X3, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import Link from "next/link"

export default function EventsPage() {
  const stream = useEventStream()
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [filters, setFilters] = useState({
    type: undefined as "internal" | "external" | undefined,
    active: true,
    search: "",
    limit: 20,
    offset: 0,
  })

  const { data, isLoading } = useSWR<EventsResponse>(
    ["events", filters],
    () =>
      fetchEvents({
        type: filters.type,
        active: filters.active,
        q: filters.search || undefined,
        limit: filters.limit,
        offset: filters.offset,
      }),
    { refreshInterval: 30000 }
  )

  const handleNextPage = useCallback(() => {
    setFilters((f) => ({ ...f, offset: f.offset + f.limit }))
  }, [])

  const handlePrevPage = useCallback(() => {
    setFilters((f) => ({ ...f, offset: Math.max(0, f.offset - f.limit) }))
  }, [])

  const events = data?.items ?? []
  const hasMore = events.length === filters.limit
  const currentPage = Math.floor(filters.offset / filters.limit) + 1

  return (
    <div className="min-h-screen gradient-mesh">
      <Navigation connected={stream.connected} />

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
            <p className="text-muted-foreground mt-1">
              Browse and search all tracked events
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-md">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "table"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterPanel
            searchValue={filters.search}
            onSearchChange={(search) =>
              setFilters((f) => ({ ...f, search, offset: 0 }))
            }
            searchPlaceholder="Search events by name, club, or category..."
            filters={[
              {
                key: "type",
                label: "All Types",
                value: filters.type,
                options: [
                  { value: "internal", label: "Internal" },
                  { value: "external", label: "External" },
                ],
                onChange: (type) =>
                  setFilters((f) => ({
                    ...f,
                    type: type as "internal" | "external" | undefined,
                    offset: 0,
                  })),
              },
              {
                key: "active",
                label: "Status",
                value: filters.active ? "active" : "all",
                options: [
                  { value: "active", label: "Active Only" },
                  { value: "all", label: "All Events" },
                ],
                onChange: (val) =>
                  setFilters((f) => ({
                    ...f,
                    active: val === "active",
                    offset: 0,
                  })),
              },
            ]}
          />
        </div>

        {/* Content */}
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              Loading events...
            </div>
          ) : viewMode === "table" ? (
            <div className="p-4">
              <EventTable events={events} />
            </div>
          ) : (
            <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {events.map((event) => (
                <Link
                  key={`${event.event_code}-${event.event_type}`}
                  href={`/events/${event.event_code}?type=${event.event_type}`}
                  className="group rounded-lg border border-border bg-card p-4 hover:border-muted-foreground/30 transition-colors"
                >
                  {event.image && (
                    <div className="aspect-video rounded-md overflow-hidden bg-secondary mb-3">
                      <img
                        src={event.image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {event.name}
                    </h3>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded shrink-0",
                        event.event_type === "internal"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
                      )}
                    >
                      {event.event_type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {event.short_description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{event.club}</span>
                    <span className="font-mono">
                      {event.price_per_ticket === 0
                        ? "Free"
                        : `$${event.price_per_ticket}`}
                    </span>
                  </div>
                  {event.start_date && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(parseISO(event.start_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  {!event.is_active && (
                    <div className="mt-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                        inactive
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {events.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filters.offset + 1} to{" "}
                {filters.offset + events.length} results
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
