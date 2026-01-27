import { config } from "./config";
import { initDb } from "./db";
import { pollEvents } from "./fetcher";
import { broadcastPollResult, startServer } from "./server";
import type { PollResult } from "./fetcher";

await initDb();

let pollInFlight = false;
let lastResult: PollResult | null = null;

async function runPoll(): Promise<PollResult> {
  const result = await pollEvents();
  lastResult = result;
  broadcastPollResult(result);
  if (result.errors.length) {
    console.error(`[poll] ${result.fetchedAt} errors:`, result.errors);
  } else {
    console.log(
      `[poll] ${result.fetchedAt} internal=${result.internalCount} external=${result.externalCount} ` +
        `new=${result.newEvents.length} updated=${result.updatedEvents.length} ` +
        `removed=${result.removedEvents.length} detailUpdates=${result.detailUpdates.length}`
    );
  }
  return result;
}

async function runPollSafely(): Promise<PollResult | null> {
  if (pollInFlight) return null;
  pollInFlight = true;
  try {
    return await runPoll();
  } catch (error) {
    console.error("[poll] failed", error);
    return null;
  } finally {
    pollInFlight = false;
  }
}

const server = startServer({
  pollNow: async () => {
    if (pollInFlight) {
      return { status: "in_progress", result: lastResult };
    }
    const result = await runPollSafely();
    return { status: result ? "ok" : "in_progress", result: result ?? lastResult };
  },
  snapshotLimit: 25
});

void runPollSafely();
setInterval(runPollSafely, Math.max(10_000, config.pollIntervalMs));

console.log(`Stream server running on http://localhost:${server.port}`);
