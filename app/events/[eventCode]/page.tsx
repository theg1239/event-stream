"use client"

import { use } from "react"
import useSWR from "swr"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { ChangesTimeline } from "@/components/changes-timeline"
import { useEventStream } from "@/hooks/use-stream"
import {
  fetchEventDetail,
  fetchChanges,
  type EventRecord,
  type EventDetail,
  type ChangesResponse,
} from "@/lib/api"
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  Star,
  Trophy,
  Users,
  FileText,
  GitCommit,
  ExternalLink,
  Hash,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface PageProps {
  params: Promise<{ eventCode: string }>
}

export default function EventDetailPage({ params }: PageProps) {
  const { eventCode } = use(params)
  const searchParams = useSearchParams()
  const eventType = searchParams.get("type") as "internal" | "external" | undefined
  const stream = useEventStream()

  const { data, isLoading, error } = useSWR(
    ["event", eventCode, eventType],
    () => fetchEventDetail(eventCode, eventType),
    { refreshInterval: 30000 }
  )

  const { data: changes } = useSWR<ChangesResponse>(
    ["event-changes", eventCode, eventType],
    () =>
      fetchChanges({
        event_code: eventCode,
        event_type: eventType,
        limit: 50,
      }),
    { refreshInterval: 30000 }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh">
        <Navigation connected={stream.connected} />
        <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="h-64 bg-secondary rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen gradient-mesh">
        <Navigation connected={stream.connected} />
        <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-12 text-center">
            <p className="text-destructive font-medium">Event not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              The event with code {eventCode} could not be found
            </p>
          </div>
        </main>
      </div>
    )
  }

  const { event, detail } = data

  return (
    <div className="min-h-screen gradient-mesh">
      <Navigation connected={stream.connected} />

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Image */}
          {event.image && (
            <div className="lg:w-80 shrink-0">
              <img
                src={event.image}
                alt={event.name}
                className="w-full aspect-video lg:aspect-square rounded-lg object-cover bg-secondary"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded font-medium",
                  event.event_type === "internal"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                )}
              >
                {event.event_type}
              </span>
              {event.featured && (
                <span className="text-xs px-2 py-1 rounded bg-chart-3/10 text-chart-3 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              {!event.is_active && (
                <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                  Inactive
                </span>
              )}
              {event.on_hold && (
                <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                  On Hold
                </span>
              )}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              {event.name}
            </h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span className="font-mono">{event.event_code}</span>
              <span>/</span>
              <span>{event.club}</span>
              <span>/</span>
              <span>{event.category}</span>
            </div>

            <p className="text-muted-foreground mb-6">
              {event.short_description}
            </p>

            {/* Quick Info Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium">
                    {event.price_per_ticket === 0
                      ? "Free"
                      : `$${event.price_per_ticket}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Size</p>
                  <p className="font-medium">{event.team_size || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
                <Calendar className="h-5 w-5 text-chart-5" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {event.start_date
                      ? format(parseISO(event.start_date), "MMM d, yyyy")
                      : "TBD"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
                <Clock className="h-5 w-5 text-chart-3" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {event.end_date
                      ? format(parseISO(event.end_date), "MMM d, yyyy")
                      : "TBD"}
                  </p>
                </div>
              </div>
            </div>

            {/* Venues */}
            {event.venues && event.venues.length > 0 && (
              <div className="mt-4 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-2">
                  {event.venues.map((venue, i) => (
                    <span
                      key={i}
                      className="text-sm px-2 py-1 rounded bg-secondary"
                    >
                      {venue}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Sections */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {detail?.long_description_md && (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-medium">Description</h2>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{detail.long_description_md}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Rules */}
            {detail?.rules && (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-medium">Rules</h2>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{detail.rules}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Prizes */}
            {detail?.prizes && (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-accent" />
                  <h2 className="font-medium">Prizes</h2>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{detail.prizes}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Judgement Criteria */}
            {detail?.judgement_criteria && (
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-chart-3" />
                  <h2 className="font-medium">Judgement Criteria</h2>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{detail.judgement_criteria}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Change History */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <GitCommit className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-medium">Change History</h2>
                <span className="text-xs text-muted-foreground">
                  ({changes?.count ?? 0} changes)
                </span>
              </div>
              {changes?.items && changes.items.length > 0 ? (
                <ChangesTimeline changes={changes.items} showDiffs />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No change history available for this event
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Slot Details */}
            {detail?.slot_details && detail.slot_details.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-medium">Schedule</h2>
                </div>
                <div className="space-y-3">
                  {detail.slot_details.map((slot, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-md bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {slot.start_date
                            ? format(parseISO(slot.start_date), "MMM d, HH:mm")
                            : "TBD"}
                        </span>
                        {slot.end_date && (
                          <>
                            <span className="text-muted-foreground">-</span>
                            <span>
                              {format(parseISO(slot.end_date), "HH:mm")}
                            </span>
                          </>
                        )}
                      </div>
                      {slot.venue && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{slot.venue}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {(detail?.coordinator1_email || detail?.coordinator1_phone) && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="font-medium mb-4">Contact</h2>
                <div className="space-y-3">
                  {detail.coordinator1_email && (
                    <a
                      href={`mailto:${detail.coordinator1_email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      <span>{detail.coordinator1_email}</span>
                    </a>
                  )}
                  {detail.coordinator1_phone && (
                    <a
                      href={`tel:${detail.coordinator1_phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{detail.coordinator1_phone}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-medium mb-4">Metadata</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-mono text-xs">
                    {format(parseISO(event.created_at), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-mono text-xs">
                    {format(parseISO(event.updated_at), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registrable</span>
                  <span>{event.is_registrable ? "Yes" : "No"}</span>
                </div>
                {detail?.is_a_team_event !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team Event</span>
                    <span>{detail.is_a_team_event ? "Yes" : "No"}</span>
                  </div>
                )}
                {detail?.number_of_participants && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Participants</span>
                    <span>{detail.number_of_participants}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Raw Data Link */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-medium mb-4">Developer</h2>
              <a
                href={`/api/events/${event.event_code}?type=${event.event_type}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View Raw JSON
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
