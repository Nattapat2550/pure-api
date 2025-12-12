// src/utils/apiClient.ts
import { pool } from '../config/db';

export interface ApiClient {
  id: number;
  name: string;
  apiKey: string;
  isActive: boolean;
}

export async function getApiClientByKey(apiKey: string): Promise<ApiClient | null> {
  if (!apiKey) return null;

  const { rows } = await pool.query(
    `SELECT id,
            name,
            api_key   AS "apiKey",
            is_active AS "isActive"
     FROM api_clients
     WHERE api_key = $1`,
    [apiKey]
  );

  const client = rows[0];
  if (!client) return null;
  if (!client.isActive) return null;

  return client;
}
