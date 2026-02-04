"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Minus, Plus } from "lucide-react"
import { useState } from "react"

interface DiffItem {
  key: string
  before: unknown
  after: unknown
}

interface ChangeDiffProps {
  diff: DiffItem[]
  className?: string
  initialExpanded?: boolean
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}

function DiffLine({ item }: { item: DiffItem }) {
  const [expanded, setExpanded] = useState(false)
  const beforeStr = formatValue(item.before)
  const afterStr = formatValue(item.after)
  const isComplex = beforeStr.length > 50 || afterStr.length > 50 || beforeStr.includes("\n") || afterStr.includes("\n")

  if (isComplex) {
    return (
      <div className="border border-border rounded-md overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 p-2 bg-secondary/50 hover:bg-secondary transition-colors text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-mono text-sm font-medium">{item.key}</span>
        </button>
        {expanded && (
          <div className="p-2 space-y-2 text-xs font-mono">
            {item.before !== undefined && item.before !== null && (
              <div className="diff-removed p-2 rounded overflow-x-auto">
                <div className="flex items-start gap-2">
                  <Minus className="h-3 w-3 shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap break-all">{beforeStr}</pre>
                </div>
              </div>
            )}
            {item.after !== undefined && item.after !== null && (
              <div className="diff-added p-2 rounded overflow-x-auto">
                <div className="flex items-start gap-2">
                  <Plus className="h-3 w-3 shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap break-all">{afterStr}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="font-mono text-muted-foreground min-w-[120px] shrink-0">
        {item.key}
      </span>
      <div className="flex-1 space-y-1">
        {item.before !== undefined && item.before !== null && (
          <div className="diff-removed px-2 py-1 rounded font-mono text-xs flex items-center gap-1">
            <Minus className="h-3 w-3 shrink-0" />
            <span className="truncate">{beforeStr}</span>
          </div>
        )}
        {item.after !== undefined && item.after !== null && (
          <div className="diff-added px-2 py-1 rounded font-mono text-xs flex items-center gap-1">
            <Plus className="h-3 w-3 shrink-0" />
            <span className="truncate">{afterStr}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ChangeDiff({ diff, className, initialExpanded = true }: ChangeDiffProps) {
  const [expanded, setExpanded] = useState(initialExpanded)

  if (!diff || diff.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No changes recorded
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>{diff.length} field{diff.length !== 1 ? "s" : ""} changed</span>
      </button>
      
      {expanded && (
        <div className="space-y-2 pl-5">
          {diff.map((item, index) => (
            <DiffLine key={`${item.key}-${index}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
