import { createHash } from "node:crypto";
import { SQL } from "bun";
import { config } from "./config";
import type { EventDetail, EventListItem, EventType } from "./types";

export type UpsertAction = "insert" | "update" | "none";
export type ChangeEntity = "event_list" | "event_detail";
export type ChangeKind = "insert" | "update" | "remove";

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL must be set for Postgres.");
}

export const sql = new SQL(config.databaseUrl);

function isConnectionClosed(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message ?? "";
  return code === "ERR_POSTGRES_CONNECTION_CLOSED" || /connection closed/i.test(message);
}

async function exec<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (error) {
    if (isConnectionClosed(error)) {
      try {
        await sql.connect();
      } catch {
        // fall through and retry
      }
      return await fn();
    }
    throw error;
  }
}

const db = Object.assign(
  (strings: TemplateStringsArray, ...values: unknown[]) => exec(() => sql(strings, ...values)),
  {
    unsafe: (text: string, values: unknown[] = []) => exec(() => sql.unsafe(text, values))
  }
);

export async function initDb() {
  await exec(() => sql.connect());
  await db`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      event_code TEXT NOT NULL,
      event_type TEXT NOT NULL,
      name TEXT,
      category TEXT,
      club TEXT,
      short_description TEXT,
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      price_per_ticket NUMERIC,
      team_size TEXT,
      venues JSONB,
      image TEXT,
      featured BOOLEAN,
      on_hold BOOLEAN,
      is_registrable BOOLEAN,
      raw_json JSONB NOT NULL,
      hash TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      UNIQUE(event_code, event_type)
    );
  `;

  await db`
    CREATE TABLE IF NOT EXISTS event_details (
      id BIGSERIAL PRIMARY KEY,
      event_code TEXT NOT NULL,
      event_type TEXT NOT NULL,
      name TEXT,
      category TEXT,
      club TEXT,
      long_description_md TEXT,
      short_description TEXT,
      rules TEXT,
      prizes TEXT,
      judgement_criteria TEXT,
      coordinator1_email TEXT,
      coordinator1_phone TEXT,
      is_a_team_event BOOLEAN,
      number_of_participants TEXT,
      price_per_ticket NUMERIC,
      slot_details JSONB,
      image TEXT,
      raw_json JSONB NOT NULL,
      hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      UNIQUE(event_code, event_type)
    );
  `;

  await db`
    CREATE TABLE IF NOT EXISTS event_changes (
      id BIGSERIAL PRIMARY KEY,
      event_code TEXT NOT NULL,
      event_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      change_kind TEXT NOT NULL,
      fetched_at TIMESTAMPTZ NOT NULL,
      event_name TEXT,
      category TEXT,
      club TEXT,
      price_per_ticket NUMERIC,
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      venues JSONB,
      hash_before TEXT,
      hash_after TEXT,
      data_before JSONB,
      data_after JSONB,
      diff JSONB
    );
  `;

  await db`ALTER TABLE event_changes ADD COLUMN IF NOT EXISTS event_name TEXT;`;
  await db`ALTER TABLE event_changes ADD COLUMN IF NOT EXISTS category TEXT;`;
  await db`ALTER TABLE event_changes ADD COLUMN IF NOT EXISTS club TEXT;`;
  await db`ALTER TABLE event_changes ADD COLUMN IF NOT EXISTS price_per_ticket NUMERIC;`;
  await db`ALTER TABLE event_changes ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;`;
  await db`ALTER TABLE event_changes ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;`;
  await db`ALTER TABLE event_changes ADD COLUMN IF NOT EXISTS venues JSONB;`;

  await db`
    CREATE TABLE IF NOT EXISTS poll_runs (
      id BIGSERIAL PRIMARY KEY,
      fetched_at TIMESTAMPTZ NOT NULL,
      internal_count INTEGER NOT NULL,
      external_count INTEGER NOT NULL,
      new_events INTEGER NOT NULL,
      updated_events INTEGER NOT NULL,
      removed_events INTEGER NOT NULL,
      detail_updates INTEGER NOT NULL,
      errors TEXT
    );
  `;

  await db`CREATE INDEX IF NOT EXISTS idx_events_type_active ON events (event_type, is_active);`;
  await db`CREATE INDEX IF NOT EXISTS idx_events_start_date ON events (start_date);`;
  await db`CREATE INDEX IF NOT EXISTS idx_events_updated_at ON events (updated_at DESC);`;
  await db`CREATE INDEX IF NOT EXISTS idx_event_details_code_type ON event_details (event_code, event_type);`;
  await db`CREATE INDEX IF NOT EXISTS idx_changes_time ON event_changes (fetched_at DESC);`;
  await db`
    CREATE INDEX IF NOT EXISTS idx_changes_code_type_time
    ON event_changes (event_code, event_type, fetched_at DESC);
  `;
  await db`
    CREATE INDEX IF NOT EXISTS idx_changes_entity_kind_time
    ON event_changes (entity_type, change_kind, fetched_at DESC);
  `;
  await db`CREATE INDEX IF NOT EXISTS idx_changes_start_date ON event_changes (start_date DESC);`;
  await db`CREATE INDEX IF NOT EXISTS idx_changes_name ON event_changes (event_name);`;
  await db`CREATE INDEX IF NOT EXISTS idx_changes_club ON event_changes (club);`;
  await db`CREATE INDEX IF NOT EXISTS idx_changes_category ON event_changes (category);`;
  await db`CREATE INDEX IF NOT EXISTS idx_changes_brin_time ON event_changes USING BRIN (fetched_at);`;
  await db`CREATE INDEX IF NOT EXISTS idx_changes_data_after_gin ON event_changes USING GIN (data_after);`;
  await db`CREATE INDEX IF NOT EXISTS idx_changes_diff_gin ON event_changes USING GIN (diff);`;
  await db`CREATE INDEX IF NOT EXISTS idx_poll_runs_time ON poll_runs (fetched_at DESC);`;

  await db`
    CREATE TABLE IF NOT EXISTS change_rollups_daily (
      day DATE NOT NULL,
      event_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      change_kind TEXT NOT NULL,
      count BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (day, event_type, entity_type, change_kind)
    );
  `;
}

function hashString(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeJson(value: unknown) {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function extractMeta(data: Record<string, unknown> | null | undefined) {
  if (!data) return {};
  const price =
    typeof data.price_per_ticket === "number"
      ? data.price_per_ticket
      : typeof data.price_per_ticket === "string"
        ? Number.parseFloat(data.price_per_ticket)
        : null;
  return {
    event_name: typeof data.name === "string" ? data.name : null,
    category: typeof data.category === "string" ? data.category : null,
    club: typeof data.club === "string" ? data.club : null,
    price_per_ticket: Number.isFinite(price) ? price : null,
    start_date: typeof data.start_date === "string" ? data.start_date : null,
    end_date: typeof data.end_date === "string" ? data.end_date : null,
    venues: data.venues ?? null
  };
}

function diffTopLevel(before: Record<string, unknown>, after: Record<string, unknown>) {
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  const diff: Array<{ key: string; before: unknown; after: unknown }> = [];
  for (const key of keys) {
    const prev = (before as Record<string, unknown>)[key];
    const next = (after as Record<string, unknown>)[key];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      diff.push({ key, before: prev ?? null, after: next ?? null });
    }
  }
  return diff;
}

async function recordChange(params: {
  eventCode: string;
  eventType: EventType;
  entityType: ChangeEntity;
  changeKind: ChangeKind;
  fetchedAt: string;
  hashBefore?: string | null;
  hashAfter?: string | null;
  dataBefore?: Record<string, unknown> | null;
  dataAfter?: Record<string, unknown> | null;
}) {
  const diff =
    params.dataBefore && params.dataAfter
      ? diffTopLevel(params.dataBefore, params.dataAfter)
      : [];

  const metaSource = params.dataAfter ?? params.dataBefore ?? null;
  const meta = extractMeta(metaSource);

  await db`
    INSERT INTO event_changes (
      event_code, event_type, entity_type, change_kind, fetched_at,
      event_name, category, club, price_per_ticket, start_date, end_date, venues,
      hash_before, hash_after, data_before, data_after, diff
    ) VALUES (
      ${params.eventCode}, ${params.eventType}, ${params.entityType}, ${params.changeKind},
      ${params.fetchedAt},
      ${meta.event_name ?? null},
      ${meta.category ?? null},
      ${meta.club ?? null},
      ${meta.price_per_ticket ?? null},
      ${meta.start_date ?? null},
      ${meta.end_date ?? null},
      ${meta.venues ? JSON.stringify(meta.venues) : null},
      ${params.hashBefore ?? null}, ${params.hashAfter ?? null},
      ${params.dataBefore ? JSON.stringify(params.dataBefore) : null},
      ${params.dataAfter ? JSON.stringify(params.dataAfter) : null},
      ${JSON.stringify(diff)}
    )
  `;

  await db`
    INSERT INTO change_rollups_daily (
      day, event_type, entity_type, change_kind, count
    ) VALUES (
      ${params.fetchedAt}::date, ${params.eventType}, ${params.entityType}, ${params.changeKind}, 1
    )
    ON CONFLICT (day, event_type, entity_type, change_kind)
    DO UPDATE SET count = change_rollups_daily.count + 1
  `;
}

export async function upsertEvent(
  item: EventListItem,
  eventType: EventType,
  fetchedAt: string
) {
  const rawJson = item as unknown as Record<string, unknown>;
  const hash = hashString(JSON.stringify(rawJson));

  const existing = (await db`
    SELECT hash, is_active, raw_json FROM events
    WHERE event_code = ${item.pid} AND event_type = ${eventType}
    LIMIT 1
  `) as Array<{ hash: string; is_active: boolean; raw_json: unknown }>;

  if (existing.length === 0) {
    await db`
      INSERT INTO events (
        event_code, event_type, name, category, club, short_description,
        start_date, end_date, price_per_ticket, team_size, venues, image,
        featured, on_hold, is_registrable, raw_json, hash, is_active,
        created_at, updated_at
      ) VALUES (
        ${item.pid}, ${eventType}, ${item.name}, ${item.category}, ${item.club},
        ${item.description}, ${item.start_date}, ${item.end_date},
        ${item.price_per_ticket}, ${item.team_size}, ${JSON.stringify(item.venues ?? [])},
        ${item.image}, ${item.featured}, ${item.on_hold}, ${item.is_registrable},
        ${JSON.stringify(rawJson)}, ${hash}, TRUE, ${fetchedAt}, ${fetchedAt}
      )
    `;
    await recordChange({
      eventCode: item.pid,
      eventType,
      entityType: "event_list",
      changeKind: "insert",
      fetchedAt,
      hashAfter: hash,
      dataAfter: rawJson
    });
    return { action: "insert" as UpsertAction };
  }

  const beforeJson = normalizeJson(existing[0].raw_json) as Record<string, unknown> | null;

  if (existing[0].hash !== hash || existing[0].is_active === false) {
    await db`
      UPDATE events SET
        name = ${item.name},
        category = ${item.category},
        club = ${item.club},
        short_description = ${item.description},
        start_date = ${item.start_date},
        end_date = ${item.end_date},
        price_per_ticket = ${item.price_per_ticket},
        team_size = ${item.team_size},
        venues = ${JSON.stringify(item.venues ?? [])},
        image = ${item.image},
        featured = ${item.featured},
        on_hold = ${item.on_hold},
        is_registrable = ${item.is_registrable},
        raw_json = ${JSON.stringify(rawJson)},
        hash = ${hash},
        is_active = TRUE,
        updated_at = ${fetchedAt}
      WHERE event_code = ${item.pid} AND event_type = ${eventType}
    `;
    await recordChange({
      eventCode: item.pid,
      eventType,
      entityType: "event_list",
      changeKind: "update",
      fetchedAt,
      hashBefore: existing[0].hash,
      hashAfter: hash,
      dataBefore: beforeJson ?? undefined,
      dataAfter: rawJson
    });
    return { action: "update" as UpsertAction };
  }

  return { action: "none" as UpsertAction };
}

export async function upsertEventDetail(
  detail: EventDetail,
  eventCode: string,
  eventType: EventType,
  fetchedAt: string
) {
  const rawJson = detail as unknown as Record<string, unknown>;
  const hash = hashString(JSON.stringify(rawJson));

  const existing = (await db`
    SELECT hash, raw_json FROM event_details
    WHERE event_code = ${eventCode} AND event_type = ${eventType}
    LIMIT 1
  `) as Array<{ hash: string; raw_json: unknown }>;

  const slotDetails = Array.isArray(detail.slot_details) ? detail.slot_details : [];

  if (existing.length === 0) {
    await db`
      INSERT INTO event_details (
        event_code, event_type, name, category, club, long_description_md,
        short_description, rules, prizes, judgement_criteria,
        coordinator1_email, coordinator1_phone, is_a_team_event,
        number_of_participants, price_per_ticket, slot_details, image,
        raw_json, hash, created_at, updated_at
      ) VALUES (
        ${eventCode}, ${eventType}, ${detail.name}, ${detail.category}, ${detail.club},
        ${detail.description}, ${detail.short_description ?? null}, ${detail.rules ?? null},
        ${detail.prizes ?? null}, ${detail.judgement_criteria ?? null},
        ${detail.coordinator1_email ?? null}, ${detail.coordinator1_phone ?? null},
        ${detail.is_a_team_event}, ${detail.number_of_participants ?? null},
        ${detail.price_per_ticket}, ${JSON.stringify(slotDetails)}, ${detail.image ?? null},
        ${JSON.stringify(rawJson)}, ${hash}, ${fetchedAt}, ${fetchedAt}
      )
    `;
    await recordChange({
      eventCode,
      eventType,
      entityType: "event_detail",
      changeKind: "insert",
      fetchedAt,
      hashAfter: hash,
      dataAfter: rawJson
    });
    return { action: "insert" as UpsertAction };
  }

  const beforeJson = normalizeJson(existing[0].raw_json) as Record<string, unknown> | null;

  if (existing[0].hash !== hash) {
    await db`
      UPDATE event_details SET
        name = ${detail.name},
        category = ${detail.category},
        club = ${detail.club},
        long_description_md = ${detail.description},
        short_description = ${detail.short_description ?? null},
        rules = ${detail.rules ?? null},
        prizes = ${detail.prizes ?? null},
        judgement_criteria = ${detail.judgement_criteria ?? null},
        coordinator1_email = ${detail.coordinator1_email ?? null},
        coordinator1_phone = ${detail.coordinator1_phone ?? null},
        is_a_team_event = ${detail.is_a_team_event},
        number_of_participants = ${detail.number_of_participants ?? null},
        price_per_ticket = ${detail.price_per_ticket},
        slot_details = ${JSON.stringify(slotDetails)},
        image = ${detail.image ?? null},
        raw_json = ${JSON.stringify(rawJson)},
        hash = ${hash},
        updated_at = ${fetchedAt}
      WHERE event_code = ${eventCode} AND event_type = ${eventType}
    `;
    await recordChange({
      eventCode,
      eventType,
      entityType: "event_detail",
      changeKind: "update",
      fetchedAt,
      hashBefore: existing[0].hash,
      hashAfter: hash,
      dataBefore: beforeJson ?? undefined,
      dataAfter: rawJson
    });
    return { action: "update" as UpsertAction };
  }

  return { action: "none" as UpsertAction };
}

export async function markMissingEventsInactive(
  eventType: EventType,
  activeCodes: Set<string>,
  fetchedAt: string
) {
  const rows = (await db`
    SELECT event_code, raw_json, hash FROM events
    WHERE event_type = ${eventType} AND is_active = TRUE
  `) as Array<{ event_code: string; raw_json: unknown; hash: string }>;

  const removed: string[] = [];
  for (const row of rows) {
    if (!activeCodes.has(row.event_code)) {
      await db`
        UPDATE events
        SET is_active = FALSE, updated_at = ${fetchedAt}
        WHERE event_code = ${row.event_code} AND event_type = ${eventType}
      `;
      const beforeJson = normalizeJson(row.raw_json) as Record<string, unknown> | null;
      await recordChange({
        eventCode: row.event_code,
        eventType,
        entityType: "event_list",
        changeKind: "remove",
        fetchedAt,
        hashBefore: row.hash,
        dataBefore: beforeJson ?? undefined
      });
      removed.push(row.event_code);
    }
  }

  return removed;
}

export async function recordPollRun(params: {
  fetchedAt: string;
  internalCount: number;
  externalCount: number;
  newEvents: number;
  updatedEvents: number;
  removedEvents: number;
  detailUpdates: number;
  errors?: string | null;
}) {
  await db`
    INSERT INTO poll_runs (
      fetched_at, internal_count, external_count, new_events,
      updated_events, removed_events, detail_updates, errors
    ) VALUES (
      ${params.fetchedAt}, ${params.internalCount}, ${params.externalCount},
      ${params.newEvents}, ${params.updatedEvents}, ${params.removedEvents},
      ${params.detailUpdates}, ${params.errors ?? null}
    )
  `;
}

export async function getLastPollRun() {
  const rows = (await db`
    SELECT * FROM poll_runs ORDER BY id DESC LIMIT 1
  `) as Array<Record<string, unknown>>;
  return rows[0];
}

export async function getCounts() {
  const totalRows = (await db`
    SELECT COUNT(*)::int as count FROM events
  `) as Array<{ count: number }>;

  const activeRows = (await db`
    SELECT COUNT(*)::int as count FROM events WHERE is_active = TRUE
  `) as Array<{ count: number }>;

  return { total: totalRows[0]?.count ?? 0, active: activeRows[0]?.count ?? 0 };
}

export async function listEvents(params: {
  eventType?: EventType;
  activeOnly?: boolean;
  limit: number;
  offset: number;
  search?: string;
}) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (params.eventType) {
    values.push(params.eventType);
    clauses.push(`event_type = $${values.length}`);
  }
  if (params.activeOnly) {
    clauses.push("is_active = TRUE");
  }
  if (params.search) {
    values.push(`%${params.search}%`);
    const idx = values.length;
    clauses.push(`(name ILIKE $${idx} OR club ILIKE $${idx} OR category ILIKE $${idx})`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  values.push(params.limit, params.offset);
  const limitIdx = values.length - 1;
  const offsetIdx = values.length;

  const query = `
    SELECT * FROM events
    ${where}
    ORDER BY start_date ASC NULLS LAST
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  return (await db.unsafe(query, values)) as Array<Record<string, unknown>>;
}

export async function listRecentEvents(limit: number) {
  const rows = (await db`
    SELECT * FROM events
    ORDER BY updated_at DESC NULLS LAST
    LIMIT ${limit}
  `) as Array<Record<string, unknown>>;
  return rows;
}

export async function getEventWithDetail(eventCode: string, eventType?: EventType) {
  const values: unknown[] = [eventCode];
  let where = "event_code = $1";

  if (eventType) {
    values.push(eventType);
    where += ` AND event_type = $${values.length}`;
  }

  const eventQuery = `SELECT * FROM events WHERE ${where} ORDER BY id DESC LIMIT 1`;
  const events = (await db.unsafe(eventQuery, values)) as Array<Record<string, unknown>>;
  const event = events[0];
  if (!event) return undefined;

  const details = (await db.unsafe(
    `SELECT * FROM event_details WHERE event_code = $1 AND event_type = $2 ORDER BY id DESC LIMIT 1`,
    [event.event_code, event.event_type]
  )) as Array<Record<string, unknown>>;

  return { event, detail: details[0] };
}

export async function listChanges(params: {
  eventCode?: string;
  eventType?: EventType;
  entityType?: ChangeEntity;
  changeKind?: ChangeKind;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (params.eventCode) {
    values.push(params.eventCode);
    clauses.push(`event_code = $${values.length}`);
  }
  if (params.eventType) {
    values.push(params.eventType);
    clauses.push(`event_type = $${values.length}`);
  }
  if (params.entityType) {
    values.push(params.entityType);
    clauses.push(`entity_type = $${values.length}`);
  }
  if (params.changeKind) {
    values.push(params.changeKind);
    clauses.push(`change_kind = $${values.length}`);
  }
  if (params.from) {
    values.push(params.from);
    clauses.push(`fetched_at >= $${values.length}`);
  }
  if (params.to) {
    values.push(params.to);
    clauses.push(`fetched_at <= $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  values.push(params.limit, params.offset);
  const limitIdx = values.length - 1;
  const offsetIdx = values.length;

  const query = `
    SELECT * FROM event_changes
    ${where}
    ORDER BY fetched_at DESC, id DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  return (await db.unsafe(query, values)) as Array<Record<string, unknown>>;
}

export async function listChangesPage(params: {
  eventCode?: string;
  eventType?: EventType;
  entityType?: ChangeEntity;
  changeKind?: ChangeKind;
  from?: string;
  to?: string;
  cursor?: { fetchedAt: string; id: number };
  limit: number;
}) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (params.eventCode) {
    values.push(params.eventCode);
    clauses.push(`event_code = $${values.length}`);
  }
  if (params.eventType) {
    values.push(params.eventType);
    clauses.push(`event_type = $${values.length}`);
  }
  if (params.entityType) {
    values.push(params.entityType);
    clauses.push(`entity_type = $${values.length}`);
  }
  if (params.changeKind) {
    values.push(params.changeKind);
    clauses.push(`change_kind = $${values.length}`);
  }
  if (params.from) {
    values.push(params.from);
    clauses.push(`fetched_at >= $${values.length}`);
  }
  if (params.to) {
    values.push(params.to);
    clauses.push(`fetched_at <= $${values.length}`);
  }
  if (params.cursor) {
    values.push(params.cursor.fetchedAt, params.cursor.id);
    const idx = values.length - 1;
    clauses.push(`(fetched_at, id) < ($${idx}, $${idx + 1})`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  values.push(params.limit);
  const limitIdx = values.length;

  const query = `
    SELECT * FROM event_changes
    ${where}
    ORDER BY fetched_at DESC, id DESC
    LIMIT $${limitIdx}
  `;

  return (await db.unsafe(query, values)) as Array<Record<string, unknown>>;
}

export async function listDailyRollups(params: {
  from?: string;
  to?: string;
  eventType?: EventType;
  entityType?: ChangeEntity;
  changeKind?: ChangeKind;
}) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (params.from) {
    values.push(params.from);
    clauses.push(`day >= $${values.length}::date`);
  }
  if (params.to) {
    values.push(params.to);
    clauses.push(`day <= $${values.length}::date`);
  }
  if (params.eventType) {
    values.push(params.eventType);
    clauses.push(`event_type = $${values.length}`);
  }
  if (params.entityType) {
    values.push(params.entityType);
    clauses.push(`entity_type = $${values.length}`);
  }
  if (params.changeKind) {
    values.push(params.changeKind);
    clauses.push(`change_kind = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const query = `
    SELECT * FROM change_rollups_daily
    ${where}
    ORDER BY day DESC
  `;

  return (await db.unsafe(query, values)) as Array<Record<string, unknown>>;
}
