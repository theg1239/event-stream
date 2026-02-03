// Stats card with trend indicators
"use client"

import { cn } from "@/lib/utils"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number | string
  previousValue?: number
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendLabel?: string
  className?: string
  valueClassName?: string
}

export function StatsCard({
  title,
  value,
  previousValue,
  icon: Icon,
  trend,
  trendLabel,
  className,
  valueClassName,
}: StatsCardProps) {
  const calculatedTrend = trend ?? (
    previousValue !== undefined
      ? typeof value === "number"
        ? value > previousValue
          ? "up"
          : value < previousValue
            ? "down"
            : "neutral"
        : "neutral"
      : undefined
  )

  const percentChange = previousValue && typeof value === "number" && previousValue !== 0
    ? Math.round(((value - previousValue) / previousValue) * 100)
    : null

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-semibold tracking-tight ticker-value",
            valueClassName
          )}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-md bg-secondary p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {(calculatedTrend || trendLabel) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {calculatedTrend && (
            <span
              className={cn(
                "flex items-center gap-0.5 font-medium",
                calculatedTrend === "up" && "text-primary",
                calculatedTrend === "down" && "text-destructive",
                calculatedTrend === "neutral" && "text-muted-foreground"
              )}
            >
              {calculatedTrend === "up" && <ArrowUp className="h-3 w-3" />}
              {calculatedTrend === "down" && <ArrowDown className="h-3 w-3" />}
              {calculatedTrend === "neutral" && <Minus className="h-3 w-3" />}
              {percentChange !== null && `${Math.abs(percentChange)}%`}
            </span>
          )}
          {trendLabel && (
            <span className="text-muted-foreground">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
