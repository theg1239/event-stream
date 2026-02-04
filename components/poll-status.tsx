"use client"

import { cn } from "@/lib/utils"
import { format, parseISO, formatDistanceToNow } from "date-fns"
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import type { PollRun } from "@/lib/api"
import type { PollSummary } from "@/hooks/use-stream"

interface PollStatusProps {
  lastPoll?: PollRun | null
  liveSummary?: PollSummary | null
  onTriggerPoll?: () => void
  isPolling?: boolean
  className?: string
}

export function PollStatus({
  lastPoll,
  liveSummary,
  onTriggerPoll,
  isPolling,
  className,
}: PollStatusProps) {
  const displayData = liveSummary || lastPoll
  const hasErrors = liveSummary?.errors?.length || lastPoll?.errors

  const fetchedAt = liveSummary?.fetchedAt || lastPoll?.fetched_at

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <AlertCircle className="h-5 w-5 text-accent" />
          ) : (
            <CheckCircle className="h-5 w-5 text-primary" />
          )}
          <h3 className="font-medium">Last Poll</h3>
        </div>
        {onTriggerPoll && (
          <button
            onClick={onTriggerPoll}
            disabled={isPolling}
            className={cn(
              "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border",
              "hover:bg-secondary transition-colors",
              isPolling && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isPolling && "animate-spin")} />
            {isPolling ? "Polling..." : "Poll Now"}
          </button>
        )}
      </div>

      {displayData ? (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="h-4 w-4" />
            <span>
              {fetchedAt && formatDistanceToNow(parseISO(fetchedAt), { addSuffix: true })}
            </span>
            {fetchedAt && (
              <span className="text-xs">
                ({format(parseISO(fetchedAt), "MMM d, HH:mm:ss")})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-md bg-secondary/50">
              <p className="text-2xl font-semibold text-primary">
                {liveSummary?.newEvents ?? lastPoll?.new_events ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">New</p>
            </div>
            <div className="text-center p-2 rounded-md bg-secondary/50">
              <p className="text-2xl font-semibold text-accent">
                {liveSummary?.updatedEvents ?? lastPoll?.updated_events ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Updated</p>
            </div>
            <div className="text-center p-2 rounded-md bg-secondary/50">
              <p className="text-2xl font-semibold text-destructive">
                {liveSummary?.removedEvents ?? lastPoll?.removed_events ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Removed</p>
            </div>
            <div className="text-center p-2 rounded-md bg-secondary/50">
              <p className="text-2xl font-semibold text-chart-5">
                {liveSummary?.detailUpdates ?? lastPoll?.detail_updates ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Details</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Internal:</span>
              <span className="font-medium">
                {liveSummary?.internalCount ?? lastPoll?.internal_count ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-muted-foreground">External:</span>
              <span className="font-medium">
                {liveSummary?.externalCount ?? lastPoll?.external_count ?? 0}
              </span>
            </div>
          </div>

          {hasErrors && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-1">Errors</p>
              <p className="text-xs text-destructive/80 font-mono">
                {liveSummary?.errors?.join(", ") || lastPoll?.errors}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No poll data available</p>
      )}
    </div>
  )
}
