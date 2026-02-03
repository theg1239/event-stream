// Activity feed component for real-time event updates
"use client"

import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { GitMerge, Plus, Trash2, RefreshCw } from "lucide-react"
import type { ActivityItem } from "@/hooks/use-stream"

interface ActivityFeedProps {
  items: ActivityItem[]
  maxItems?: number
  className?: string
}

function getActivityIcon(action: string) {
  switch (action) {
    case "insert":
      return Plus
    case "update":
      return RefreshCw
    case "remove":
      return Trash2
    default:
      return GitMerge
  }
}

function getActivityColor(action: string) {
  switch (action) {
    case "insert":
      return "text-primary bg-primary/10"
    case "update":
      return "text-accent bg-accent/10"
    case "remove":
      return "text-destructive bg-destructive/10"
    default:
      return "text-muted-foreground bg-secondary"
  }
}

function getActivityLabel(item: ActivityItem) {
  const entity = item.type === "event_detail_upsert" ? "detail" : "event"
  const action = item.action === "insert" ? "created" : item.action === "update" ? "updated" : "removed"
  return `${entity} ${action}`
}

export function ActivityFeed({ items, maxItems = 10, className }: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems)

  if (displayItems.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground text-sm", className)}>
        No recent activity. Waiting for updates...
      </div>
    )
  }

  return (
    <div className={cn("space-y-1", className)}>
      {displayItems.map((item, index) => {
        const Icon = getActivityIcon(item.action)
        const colorClass = getActivityColor(item.action)
        
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className={cn("rounded-md p-1.5", colorClass)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-sm truncate max-w-[200px]">
                  {item.eventCode}
                </span>
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  item.eventType === "internal" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-accent/10 text-accent"
                )}>
                  {item.eventType}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getActivityLabel(item)}
              </p>
            </div>
            
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </time>
          </div>
        )
      })}
    </div>
  )
}
