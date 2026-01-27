import { existsSync, readFileSync } from "node:fs";

type FileConfig = {
  baseUrl?: string;
  pollIntervalMs?: number;
  pageLimit?: number;
  minPrice?: number;
  port?: number;
  detailConcurrency?: number;
  databaseUrl?: string;
};

function loadJson5Config(path: string): FileConfig {
  if (!existsSync(path)) return {};
  try {
    const text = readFileSync(path, "utf8");
    return (Bun.JSON5.parse(text) ?? {}) as FileConfig;
  } catch (error) {
    console.warn(`[config] failed to parse ${path}:`, error);
    return {};
  }
}

const configPath = process.env.CONFIG_PATH ?? "./config.json5";
const fileConfig = loadJson5Config(configPath);

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

const envBaseUrl = process.env.BASE_URL;
const envPageLimit = process.env.PAGE_LIMIT;
const envMinPrice = process.env.MIN_PRICE;

const baseUrl =
  normalizeBaseUrl(fileConfig.baseUrl) ??
  normalizeBaseUrl(envBaseUrl)
  
export const config = {
  baseUrl: process.env.BASE_URL
    ? normalizeBaseUrl(process.env.BASE_URL)!
    : baseUrl,
  pollIntervalMs: Number.parseInt(
    process.env.POLL_INTERVAL_MS ?? String(fileConfig.pollIntervalMs ?? 60000),
    10
  ),
  pageLimit: Number.parseInt(envPageLimit ?? String(fileConfig.pageLimit ?? 50), 10),
  minPrice: Number.parseInt(envMinPrice ?? String(fileConfig.minPrice ?? 0), 10),
  port: Number.parseInt(process.env.PORT ?? String(fileConfig.port ?? 3000), 10),
  detailConcurrency: Number.parseInt(
    process.env.DETAIL_CONCURRENCY ?? String(fileConfig.detailConcurrency ?? 6),
    10
  ),
  databaseUrl:
    process.env.DATABASE_URL ??
    process.env.NEON_DATABASE_URL ??
    fileConfig.databaseUrl ??
    ""
};
