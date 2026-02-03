// Event table with compact and full view modes
"use client"

import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { Calendar, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { EventRecord } from "@/lib/api"

interface EventTableProps {
  events: EventRecord[]
  className?: string
  compact?: boolean
}

export function EventTable({ events, className, compact }: EventTableProps) {
  if (events.length === 0) {
    return (
      <div className={cn("text-center py-12 text-muted-foreground", className)}>
        No events found
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        {events.map((event) => (
          <Link
            key={`${event.event_code}-${event.event_type}`}
            href={`/events/${event.event_code}?type=${event.event_type}`}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{event.name}</span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded shrink-0",
                  event.event_type === "internal"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                )}>
                  {event.event_type}
                </span>
                {!event.is_active && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive shrink-0">
                    inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {event.club} / {event.category}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-3 font-medium text-muted-foreground">Event</th>
            <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Club</th>
            <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Category</th>
            <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
            <th className="pb-3 font-medium text-muted-foreground text-right">Price</th>
            <th className="pb-3 font-medium text-muted-foreground w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {events.map((event) => (
            <tr
              key={`${event.event_code}-${event.event_type}`}
              className="group hover:bg-secondary/30 transition-colors"
            >
              <td className="py-3">
                <div className="flex items-center gap-3">
                  {event.image && (
                    <img
                      src={event.image}
                      alt=""
                      className="h-10 w-10 rounded-md object-cover bg-secondary"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.name}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        event.event_type === "internal"
                          ? "bg-primary/10 text-primary"
                          : "bg-accent/10 text-accent"
                      )}>
                        {event.event_type}
                      </span>
                      {event.featured && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-chart-3/10 text-chart-3">
                          featured
                        </span>
                      )}
                      {!event.is_active && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                          inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {event.event_code}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 text-muted-foreground hidden md:table-cell">
                {event.club}
              </td>
              <td className="py-3 text-muted-foreground hidden lg:table-cell">
                {event.category}
              </td>
              <td className="py-3 hidden sm:table-cell">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {event.start_date
                      ? format(parseISO(event.start_date), "MMM d, yyyy")
                      : "TBD"}
                  </span>
                </div>
              </td>
              <td className="py-3 text-right">
                <span className={cn(
                  "font-mono",
                  event.price_per_ticket === 0 ? "text-primary" : "text-foreground"
                )}>
                  {event.price_per_ticket === 0
                    ? "Free"
                    : `$${event.price_per_ticket}`}
                </span>
              </td>
              <td className="py-3">
                <Link
                  href={`/events/${event.event_code}?type=${event.event_type}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
