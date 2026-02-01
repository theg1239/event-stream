import { config } from "./config";
import type { EventDetail, EventListItem, EventListResponse, EventType } from "./types";
import { markMissingEventsInactive, recordPollRun, upsertEvent, upsertEventDetail } from "./db";

export interface PollChange {
  eventType: EventType;
  eventCode: string;
  action: "insert" | "update" | "remove" | "none";
  payload?: unknown;
}

export interface PollResult {
  fetchedAt: string;
  internalCount: number;
  externalCount: number;
  newEvents: PollChange[];
  updatedEvents: PollChange[];
  removedEvents: PollChange[];
  detailUpdates: PollChange[];
  errors: string[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const fetchInit = config.skipTlsVerify
    ? ({ method: "GET", tls: { rejectUnauthorized: false } } as RequestInit)
    : ({ method: "GET" } as RequestInit);
  const response = await fetch(url, fetchInit);

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

function requireBaseUrl() {
  if (!config.baseUrl) {
    throw new Error("BASE_URL must be set to a valid absolute URL (e.g. https://riviera.vit.ac.in).");
  }
  return config.baseUrl;
}

async function fetchEventList(eventType: EventType) {
  const all: EventListItem[] = [];
  let offset = 0;
  const limit = Math.max(1, config.pageLimit);
  const baseUrl = requireBaseUrl();

  while (true) {
    const url = new URL("/api/events", baseUrl);
    url.searchParams.set("type", eventType);
    url.searchParams.set("offset", offset.toString());
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("min_price", config.minPrice.toString());

    const data = await fetchJson<EventListResponse>(url.toString());
    const events = Array.isArray(data.events) ? data.events : [];
    all.push(...events);

    if (events.length < limit) {
      break;
    }

    offset += limit;
  }

  return all;
}

async function fetchEventDetail(eventCode: string) {
  const baseUrl = requireBaseUrl();
  const url = new URL(`/api/events/${eventCode}`, baseUrl);
  return fetchJson<EventDetail>(url.toString());
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
) {
  const results: Array<R | { error: Error; item: T }> = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        results[index] = { error: error as Error, item: items[index] };
      }
    }
  });

  await Promise.all(workers);
  return results;
}

function errorToString(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export async function pollEvents(): Promise<PollResult> {
  const fetchedAt = new Date().toISOString();
  const errors: string[] = [];
  const newEvents: PollChange[] = [];
  const updatedEvents: PollChange[] = [];
  const removedEvents: PollChange[] = [];
  const detailUpdates: PollChange[] = [];

  let internalCount = 0;
  let externalCount = 0;

  for (const eventType of ["internal", "external"] as EventType[]) {
    let events: EventListItem[] = [];
    try {
      events = await fetchEventList(eventType);
    } catch (error) {
      errors.push(`List ${eventType}: ${errorToString(error)}`);
      continue;
    }

    if (eventType === "internal") internalCount = events.length;
    if (eventType === "external") externalCount = events.length;

    const activeCodes = new Set<string>();

    for (const item of events) {
      activeCodes.add(item.pid);
      const result = await upsertEvent(item, eventType, fetchedAt);
      if (result.action === "insert") {
        newEvents.push({
          eventType,
          eventCode: item.pid,
          action: "insert",
          payload: item
        });
      }
      if (result.action === "update") {
        updatedEvents.push({
          eventType,
          eventCode: item.pid,
          action: "update",
          payload: item
        });
      }
    }

    const detailResults = await mapWithConcurrency(
      events,
      config.detailConcurrency,
      async (item) => {
        const detail = await fetchEventDetail(item.pid);
        return { item, detail };
      }
    );

    for (const detailResult of detailResults) {
      if (detailResult && "error" in detailResult) {
        const failedItem = detailResult.item as EventListItem;
        errors.push(
          `Detail ${eventType} ${failedItem?.pid ?? "unknown"}: ${errorToString(detailResult.error)}`
        );
        continue;
      }

      const { item, detail } = detailResult as { item: EventListItem; detail: EventDetail };
      const result = await upsertEventDetail(detail, item.pid, eventType, fetchedAt);
      if (result.action === "insert" || result.action === "update") {
        detailUpdates.push({
          eventType,
          eventCode: item.pid,
          action: result.action,
          payload: detail
        });
      }
    }

    const removed = await markMissingEventsInactive(eventType, activeCodes, fetchedAt);
    for (const code of removed) {
      removedEvents.push({
        eventType,
        eventCode: code,
        action: "remove"
      });
    }
  }

  await recordPollRun({
    fetchedAt,
    internalCount,
    externalCount,
    newEvents: newEvents.length,
    updatedEvents: updatedEvents.length,
    removedEvents: removedEvents.length,
    detailUpdates: detailUpdates.length,
    errors: errors.length ? errors.join(" | ") : null
  });

  return {
    fetchedAt,
    internalCount,
    externalCount,
    newEvents,
    updatedEvents,
    removedEvents,
    detailUpdates,
    errors
  };
}
