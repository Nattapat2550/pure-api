import { Pool } from "pg";
import { env } from "./env";

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  ssl:
    env.NODE_ENV === "production" && env.DB_SSL
      ? { rejectUnauthorized: false }
      : undefined
});

// log ตอน pool error
db.on("error", (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error("[db] unexpected error", err);
});
