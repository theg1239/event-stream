"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Activity, Calendar, GitCommit, LayoutDashboard, Radio } from "lucide-react"

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/changes", label: "Changes", icon: GitCommit },
  { href: "/activity", label: "Activity", icon: Activity },
]

interface NavigationProps {
  connected?: boolean
}

export function Navigation({ connected }: NavigationProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Radio className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold tracking-tight">Event Stream</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="relative flex items-center justify-center">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    connected ? "bg-primary live-pulse" : "bg-destructive"
                  )}
                />
              </div>
              <span className={cn(
                "hidden sm:inline",
                connected ? "text-primary" : "text-destructive"
              )}>
                {connected ? "Live" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
