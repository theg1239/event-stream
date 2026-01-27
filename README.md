# Event Stream Service

Aggregates event data from a configured base URL, stores it in Postgres, and serves a real‑time SSE stream.

## Run

```bash
bun install
bun run dev
```

Service runs on `http://localhost:3000` by default.

## Endpoints

- `GET /health` — status + last poll
- `GET /events?type=internal|external&active=true&limit=50&offset=0&q=search`
- `GET /events/:eventCode?type=internal|external`
- `GET /changes?event_code=...&event_type=internal|external&entity=event_list|event_detail&kind=insert|update|remove&from=...&to=...&limit=50&offset=0`
- `GET /changes.jsonl?event_code=...&event_type=internal|external&entity=event_list|event_detail&kind=insert|update|remove&from=...&to=...&batch=1000&cursor=...`
- `GET /rollups/daily?event_type=internal|external&entity=event_list|event_detail&kind=insert|update|remove&from=...&to=...`
- `GET /stream` — Server‑Sent Events stream
- `GET /poll` — Trigger a poll now (returns status + result)

## Streaming

```bash
curl -N http://localhost:3000/stream
```

Events emitted:
- `snapshot` (sent on connect; includes counts + last poll + recent events)
- `event_upsert`
- `event_removed`
- `event_detail_upsert`
- `poll_summary`
- `ping`

## Env Vars

- `PORT`
- `BASE_URL`
- `POLL_INTERVAL_MS`
- `PAGE_LIMIT`
- `MIN_PRICE`
- `DETAIL_CONCURRENCY`
- `DATABASE_URL` 
