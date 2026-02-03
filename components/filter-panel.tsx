// Filter panel with search and dropdown filters
"use client"

import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterOption {
  value: string
  label: string
}

interface FilterPanelProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: Array<{
    key: string
    label: string
    value: string | undefined
    options: FilterOption[]
    onChange: (value: string | undefined) => void
  }>
  className?: string
}

export function FilterPanel({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  className,
}: FilterPanelProps) {
  const hasActiveFilters = filters.some(f => f.value !== undefined)

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      {onSearchChange && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchValue || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-1">
            <select
              value={filter.value || ""}
              onChange={(e) => filter.onChange(e.target.value || undefined)}
              className={cn(
                "h-9 px-3 rounded-md border border-border bg-secondary text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                filter.value && "border-primary"
              )}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => filters.forEach(f => f.onChange(undefined))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
