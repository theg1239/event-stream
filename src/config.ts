type FileConfig = {
  baseUrl?: string;
  pollIntervalMs?: number;
  pageLimit?: number;
  minPrice?: number;
  port?: number;
  detailConcurrency?: number;
  databaseUrl?: string;
  skipTlsVerify?: boolean;
};

async function loadJson5Config(path: string): Promise<FileConfig> {
  const file = Bun.file(path);
  if (!(await file.exists())) return {};
  try {
    const text = await file.text();
    return (Bun.JSON5.parse(text) ?? {}) as FileConfig;
  } catch (error) {
    console.warn(`[config] failed to parse ${path}:`, error);
    return {};
  }
}

const configPath = Bun.env.CONFIG_PATH ?? "./config.json5";
const fileConfig = await loadJson5Config(configPath);

function normalizeBaseUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    new URL(withScheme);
    return withScheme;
  } catch {
    return null;
  }
}

const envBaseUrl = Bun.env.BASE_URL;
const envPageLimit = Bun.env.PAGE_LIMIT;
const envMinPrice = Bun.env.MIN_PRICE;
const envSkipTlsVerify = Bun.env.RIVIERA_SKIP_TLS_VERIFY ?? Bun.env.SKIP_TLS_VERIFY;

const normalizedEnvBaseUrl = normalizeBaseUrl(envBaseUrl);
if (envBaseUrl && !normalizedEnvBaseUrl) {
  console.warn(`[config] BASE_URL is invalid: "${envBaseUrl}"`);
}

const baseUrl =
  normalizeBaseUrl(fileConfig.baseUrl) ??
  normalizedEnvBaseUrl;

export const config = {
  baseUrl: normalizedEnvBaseUrl ?? baseUrl,
  pollIntervalMs: Number.parseInt(
    Bun.env.POLL_INTERVAL_MS ?? String(fileConfig.pollIntervalMs ?? 60000),
    10
  ),
  pageLimit: Number.parseInt(envPageLimit ?? String(fileConfig.pageLimit ?? 50), 10),
  minPrice: Number.parseInt(envMinPrice ?? String(fileConfig.minPrice ?? 0), 10),
  port: Number.parseInt(Bun.env.PORT ?? String(fileConfig.port ?? 3000), 10),
  detailConcurrency: Number.parseInt(
    Bun.env.DETAIL_CONCURRENCY ?? String(fileConfig.detailConcurrency ?? 6),
    10
  ),
  skipTlsVerify:
    envSkipTlsVerify === "1" ||
    envSkipTlsVerify?.toLowerCase() === "true" ||
    (typeof fileConfig.skipTlsVerify === "boolean" ? fileConfig.skipTlsVerify : false),
  databaseUrl:
    Bun.env.DATABASE_URL ??
    Bun.env.NEON_DATABASE_URL ??
    fileConfig.databaseUrl ??
    ""
};
