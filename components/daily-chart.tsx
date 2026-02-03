"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns"
import type { DailyRollup } from "@/lib/api"
import { cn } from "@/lib/utils"

interface DailyChartProps {
  data: DailyRollup[]
  days?: number
  variant?: "area" | "bar"
  className?: string
}

export function DailyChart({ data, days = 14, variant = "area", className }: DailyChartProps) {
  const chartData = useMemo(() => {
    const endDate = new Date()
    const startDate = subDays(endDate, days - 1)
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

    const grouped = new Map<string, {
      inserts: number
      updates: number
      removes: number
    }>()

    for (const day of dateRange) {
      const key = format(day, "yyyy-MM-dd")
      grouped.set(key, { inserts: 0, updates: 0, removes: 0 })
    }

    for (const item of data) {
      const key = item.day.split("T")[0]
      const existing = grouped.get(key)
      if (existing) {
        if (item.change_kind === "insert") existing.inserts += Number(item.count)
        if (item.change_kind === "update") existing.updates += Number(item.count)
        if (item.change_kind === "remove") existing.removes += Number(item.count)
      }
    }

    return Array.from(grouped.entries()).map(([day, counts]) => ({
      day,
      label: format(parseISO(day), "MMM d"),
      ...counts,
      total: counts.inserts + counts.updates + counts.removes,
    }))
  }, [data, days])

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map(d => d.total), 1)
  }, [chartData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null
    
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
        <p className="text-sm font-medium mb-2">{label}</p>
        <div className="space-y-1 text-xs">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground capitalize">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "bar") {
    return (
      <div className={cn("w-full h-[280px]", className)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              domain={[0, maxValue]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="inserts" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="updates" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="removes" stackId="a" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className={cn("w-full h-[280px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientInserts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientUpdates" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxValue]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="inserts"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#gradientInserts)"
          />
          <Area
            type="monotone"
            dataKey="updates"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fill="url(#gradientUpdates)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
