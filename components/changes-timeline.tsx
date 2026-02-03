"use client"

import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { GitMerge, Plus, Trash2, RefreshCw, FileText, Calendar } from "lucide-react"
import Link from "next/link"
import type { EventChange } from "@/lib/api"
import { ChangeDiff } from "./change-diff"

interface ChangesTimelineProps {
  changes: EventChange[]
  className?: string
  showDiffs?: boolean
}

function getChangeIcon(kind: string, entity: string) {
  if (kind === "insert") return Plus
  if (kind === "remove") return Trash2
  return RefreshCw
}

function getChangeColor(kind: string) {
  switch (kind) {
    case "insert":
      return "border-primary bg-primary/10 text-primary"
    case "update":
      return "border-accent bg-accent/10 text-accent"
    case "remove":
      return "border-destructive bg-destructive/10 text-destructive"
    default:
      return "border-muted bg-secondary text-muted-foreground"
  }
}

export function ChangesTimeline({ changes, className, showDiffs = true }: ChangesTimelineProps) {
  if (changes.length === 0) {
    return (
      <div className={cn("text-center py-12 text-muted-foreground", className)}>
        No changes found
      </div>
    )
  }

  // Group changes by date
  const groupedChanges = changes.reduce((acc, change) => {
    const date = format(parseISO(change.fetched_at), "yyyy-MM-dd")
    if (!acc[date]) acc[date] = []
    acc[date].push(change)
    return acc
  }, {} as Record<string, EventChange[]>)

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(groupedChanges).map(([date, dayChanges]) => (
        <div key={date}>
          <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm py-2 mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {format(parseISO(date), "EEEE, MMMM d, yyyy")}
              </span>
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                {dayChanges.length} change{dayChanges.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="space-y-3 relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            {dayChanges.map((change) => {
              const Icon = getChangeIcon(change.change_kind, change.entity_type)
              const colorClass = getChangeColor(change.change_kind)

              return (
                <div
                  key={change.id}
                  className="relative flex gap-4 pl-9"
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-0 top-1 h-8 w-8 rounded-full border-2 flex items-center justify-center",
                    colorClass
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-lg border border-border bg-card p-4 card-hover">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/events/${change.event_code}?type=${change.event_type}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {change.event_name || change.event_code}
                          </Link>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            change.event_type === "internal"
                              ? "bg-primary/10 text-primary"
                              : "bg-accent/10 text-accent"
                          )}>
                            {change.event_type}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {change.entity_type === "event_list" ? "list" : "detail"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {change.event_code}
                        </p>
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(parseISO(change.fetched_at), "HH:mm:ss")}
                      </time>
                    </div>

                    {/* Meta info */}
                    {(change.club || change.category) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        {change.club && <span>{change.club}</span>}
                        {change.club && change.category && <span>/</span>}
                        {change.category && <span>{change.category}</span>}
                      </div>
                    )}

                    {/* Diff */}
                    {showDiffs && change.diff && Array.isArray(change.diff) && change.diff.length > 0 && (
                      <ChangeDiff 
                        diff={change.diff as Array<{ key: string; before: unknown; after: unknown }>} 
                        initialExpanded={false}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
