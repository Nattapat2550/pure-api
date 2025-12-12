import { db } from "../config/db";

type ApiClientRow = {
  id: number;
  name: string;
  api_key: string;
  is_active: boolean;
};

let cache = new Map<string, { id: number; name: string }>();
let lastLoad = 0;
const TTL_MS = 60_000;

async function reloadIfNeeded() {
  const now = Date.now();
  if (now - lastLoad < TTL_MS && cache.size > 0) return;

  const { rows } = await db.query<ApiClientRow>(
    `SELECT id, name, api_key, is_active
     FROM api_clients
     WHERE is_active = TRUE`
  );

  const next = new Map<string, { id: number; name: string }>();
  for (const r of rows) {
    next.set(r.api_key, { id: r.id, name: r.name });
  }
  cache = next;
  lastLoad = now;
}

export async function getClientByApiKey(apiKey: string) {
  await reloadIfNeeded();
  return cache.get(apiKey) || null;
}

export function invalidateClientCache() {
  lastLoad = 0;
}
