import { getStorage, setStorage, removeStorage } from "zmp-sdk/apis";
import type { PayslipData } from "@/api/types";

const STORAGE_KEY = "payslip_cache";
const MAX_ENTRIES = 12;

interface CacheEntry {
  key: string; // "period|published_on"
  data: PayslipData;
}

interface CacheStore {
  entries: CacheEntry[];
}

function makeCacheKey(period: string, publishedOn: string): string {
  return `${period}|${publishedOn}`;
}

// In-memory mirror of Zalo storage
let memoryCache: CacheStore = { entries: [] };

/** Load cache from Zalo storage into memory. Call once on app init. */
export async function loadPayslipCache(): Promise<void> {
  try {
    const stored = await getStorage({ keys: [STORAGE_KEY] });
    const raw = stored?.[STORAGE_KEY] as CacheStore | undefined;
    if (raw?.entries) {
      memoryCache = raw;
    }
  } catch {
    // Storage unavailable (browser) — use memory only
  }
}

async function persistCache(): Promise<void> {
  try {
    await setStorage({ data: { [STORAGE_KEY]: memoryCache } });
  } catch {
    // Ignore storage errors
  }
}

/** Get a cached payslip by period and published_on. Returns null if not found or key mismatch. */
export function getCachedPayslip(period: string, publishedOn: string): PayslipData | null {
  const key = makeCacheKey(period, publishedOn);
  const entry = memoryCache.entries.find((e) => e.key === key);
  return entry?.data ?? null;
}

/** Store a payslip in cache (memory + Zalo storage). Evicts oldest beyond MAX_ENTRIES. */
export async function setCachedPayslip(
  period: string,
  publishedOn: string,
  data: PayslipData,
): Promise<void> {
  const key = makeCacheKey(period, publishedOn);

  // Remove any existing entry for this period (handles re-publish with different published_on)
  memoryCache.entries = memoryCache.entries.filter(
    (e) => !e.key.startsWith(`${period}|`),
  );

  // Add new entry at the front
  memoryCache.entries.unshift({ key, data });

  // Evict oldest beyond limit
  if (memoryCache.entries.length > MAX_ENTRIES) {
    memoryCache.entries = memoryCache.entries.slice(0, MAX_ENTRIES);
  }

  await persistCache();
}

/** Remove cached payslip for a specific period (on pull-to-refresh). */
export async function removeCachedPayslip(period: string): Promise<void> {
  memoryCache.entries = memoryCache.entries.filter(
    (e) => !e.key.startsWith(`${period}|`),
  );
  await persistCache();
}

/** Clear all cached payslips (on logout, account change, SESSION_INVALID). */
export async function clearPayslipCache(): Promise<void> {
  memoryCache = { entries: [] };
  try {
    await removeStorage({ keys: [STORAGE_KEY] });
  } catch {
    // Ignore
  }
}
