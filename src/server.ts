import { config } from "./config";
import {
  getCounts,
  getEventWithDetail,
  getLastPollRun,
  listChanges,
  listChangesPage,
  listDailyRollups,
  listEvents,
  listRecentEvents
} from "./db";
import type { PollResult } from "./fetcher";
import type { EventType } from "./types";

const clients = new Set<ReadableStreamDefaultController>();

const baseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function sseFormat(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function broadcast(event: string, data: unknown) {
  const payload = sseFormat(event, data);
  for (const client of clients) {
    try {
      client.enqueue(payload);
    } catch {
      clients.delete(client);
    }
  }
}

let heartbeat: ReturnType<typeof setInterval> | undefined;

function ensureHeartbeat() {
  if (heartbeat) return;
  heartbeat = setInterval(() => {
    broadcast("ping", { ts: new Date().toISOString() });
  }, 20000);
}

export function broadcastPollResult(result: PollResult) {
  for (const change of result.newEvents) {
    broadcast("event_upsert", change);
  }
  for (const change of result.updatedEvents) {
    broadcast("event_upsert", change);
  }
  for (const change of result.removedEvents) {
    broadcast("event_removed", change);
  }
  for (const change of result.detailUpdates) {
    broadcast("event_detail_upsert", change);
  }
  broadcast("poll_summary", {
    fetchedAt: result.fetchedAt,
    internalCount: result.internalCount,
    externalCount: result.externalCount,
    newEvents: result.newEvents.length,
    updatedEvents: result.updatedEvents.length,
    removedEvents: result.removedEvents.length,
    detailUpdates: result.detailUpdates.length,
    errors: result.errors
  });
}

function parseEventType(value: string | null): EventType | undefined {
  if (value === "internal" || value === "external") return value;
  return undefined;
}

type PollNowResult = { status: "ok" | "in_progress"; result: PollResult | null };

type ServerOptions = {
  pollNow?: () => Promise<PollNowResult>;
  snapshotLimit?: number;
};

async function buildSnapshot(limit: number) {
  const [counts, lastPoll, recent] = await Promise.all([
    getCounts(),
    getLastPollRun(),
    listRecentEvents(limit)
  ]);
  return { counts, lastPoll, recent };
}

export function startServer(options: ServerOptions = {}) {
  ensureHeartbeat();

  const server = Bun.serve({
    port: config.port,
    async fetch(req: Request) {
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: baseHeaders });
      }

      const url = new URL(req.url, `http://localhost:${config.port}`);

      if (url.pathname === "/stream") {
        let controllerRef: ReadableStreamDefaultController | null = null;
        const snapshotParam = url.searchParams.get("snapshot");
        const snapshotEnabled = snapshotParam !== "false";
        const limitParam = Number.parseInt(
          url.searchParams.get("limit") ?? String(options.snapshotLimit ?? 25),
          10
        );
        const snapshotLimit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 25;

        const stream = new ReadableStream({
          start(controller) {
            controllerRef = controller;
            clients.add(controller);
            controller.enqueue(sseFormat("ready", { ts: new Date().toISOString() }));

            if (snapshotEnabled) {
              void (async () => {
                try {
                  const snapshot = await buildSnapshot(snapshotLimit);
                  controller.enqueue(sseFormat("snapshot", snapshot));
                } catch (error) {
                  controller.enqueue(
                    sseFormat("snapshot_error", {
                      message: error instanceof Error ? error.message : String(error)
                    })
                  );
                }
              })();
            }
          },
          cancel() {
            if (controllerRef) clients.delete(controllerRef);
          }
        });

        return new Response(stream, {
          headers: {
            ...baseHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive"
          }
        });
      }

      if (url.pathname === "/health") {
        const lastPoll = await getLastPollRun();
        const counts = await getCounts();
        return Response.json(
          {
            ok: true,
            now: new Date().toISOString(),
            counts,
            lastPoll
          },
          { headers: baseHeaders }
        );
      }

      if (url.pathname === "/poll") {
        if (!options.pollNow) {
          return Response.json(
            { error: "Polling not enabled" },
            { status: 501, headers: baseHeaders }
          );
        }
        const result = await options.pollNow();
        return Response.json(result, { headers: baseHeaders });
      }

      if (url.pathname === "/events") {
        const eventType = parseEventType(url.searchParams.get("type"));
        const activeOnly = url.searchParams.get("active") !== "false";
        const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
        const offsetRaw = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
        const search = url.searchParams.get("q") ?? undefined;

        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
        const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

        const items = await listEvents({
          eventType,
          activeOnly,
          limit,
          offset,
          search
        });

        return Response.json(
          { items, limit, offset, count: items.length },
          { headers: baseHeaders }
        );
      }

      if (url.pathname === "/changes") {
        const eventType = parseEventType(url.searchParams.get("event_type"));
        const eventCode = url.searchParams.get("event_code") ?? undefined;
        const entityType = url.searchParams.get("entity") as
          | "event_list"
          | "event_detail"
          | null;
        const changeKind = url.searchParams.get("kind") as "insert" | "update" | "remove" | null;
        const from = url.searchParams.get("from") ?? undefined;
        const to = url.searchParams.get("to") ?? undefined;

        const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
        const offsetRaw = Number.parseInt(url.searchParams.get("offset") ?? "0", 10);
        const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
        const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

        const items = await listChanges({
          eventCode,
          eventType,
          entityType: entityType ?? undefined,
          changeKind: changeKind ?? undefined,
          from,
          to,
          limit,
          offset
        });

        return Response.json(
          { items, limit, offset, count: items.length },
          { headers: baseHeaders }
        );
      }

      if (url.pathname === "/changes.jsonl") {
        const eventType = parseEventType(url.searchParams.get("event_type"));
        const eventCode = url.searchParams.get("event_code") ?? undefined;
        const entityType = url.searchParams.get("entity") as
          | "event_list"
          | "event_detail"
          | null;
        const changeKind = url.searchParams.get("kind") as "insert" | "update" | "remove" | null;
        const from = url.searchParams.get("from") ?? undefined;
        const to = url.searchParams.get("to") ?? undefined;
        const batchRaw = Number.parseInt(url.searchParams.get("batch") ?? "1000", 10);
        const batch = Number.isFinite(batchRaw) ? Math.min(Math.max(batchRaw, 100), 5000) : 1000;

        const cursorParam = url.searchParams.get("cursor");
        let cursor: { fetchedAt: string; id: number } | undefined;
        if (cursorParam) {
          const [ts, idStr] = cursorParam.split("|");
          const id = Number.parseInt(idStr ?? "", 10);
          if (ts && Number.isFinite(id)) {
            cursor = { fetchedAt: ts, id };
          }
        }

        const stream = new ReadableStream({
          async start(controller) {
            try {
              let currentCursor = cursor;
              while (true) {
                const rows = await listChangesPage({
                  eventCode,
                  eventType,
                  entityType: entityType ?? undefined,
                  changeKind: changeKind ?? undefined,
                  from,
                  to,
                  cursor: currentCursor,
                  limit: batch
                });

                if (!rows.length) break;

                for (const row of rows) {
                  controller.enqueue(`${JSON.stringify(row)}\n`);
                }

                const last = rows[rows.length - 1] as { fetched_at: string; id: number };
                currentCursor = { fetchedAt: String(last.fetched_at), id: Number(last.id) };
              }
            } catch (error) {
              controller.enqueue(
                JSON.stringify({
                  error: error instanceof Error ? error.message : String(error)
                }) + "\n"
              );
            } finally {
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            ...baseHeaders,
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform"
          }
        });
      }

      if (url.pathname === "/rollups/daily") {
        const eventType = parseEventType(url.searchParams.get("event_type"));
        const entityType = url.searchParams.get("entity") as
          | "event_list"
          | "event_detail"
          | null;
        const changeKind = url.searchParams.get("kind") as "insert" | "update" | "remove" | null;
        const from = url.searchParams.get("from") ?? undefined;
        const to = url.searchParams.get("to") ?? undefined;

        const items = await listDailyRollups({
          eventType,
          entityType: entityType ?? undefined,
          changeKind: changeKind ?? undefined,
          from,
          to
        });

        return Response.json({ items, count: items.length }, { headers: baseHeaders });
      }

      if (url.pathname.startsWith("/events/")) {
        const eventCode = url.pathname.replace("/events/", "");
        const eventType = parseEventType(url.searchParams.get("type"));
        const record = await getEventWithDetail(eventCode, eventType);
        if (!record) {
          return Response.json({ error: "Not found" }, { status: 404, headers: baseHeaders });
        }
        return Response.json(record, { headers: baseHeaders });
      }

      return Response.json({ error: "Not found" }, { status: 404, headers: baseHeaders });
    }
  });

  return server;
}
