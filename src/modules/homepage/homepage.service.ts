import { db } from "../../config/db";
import { AppError } from "../../core/errors/AppError";

type Row = { section_name: string; content: string; updated_at: string };

export async function getSection(section: string) {
  const { rows } = await db.query<Row>(
    `SELECT section_name, content, updated_at
     FROM homepage_content
     WHERE section_name=$1`,
    [section]
  );
  const r = rows[0];
  if (!r) throw new AppError("Section not found", 404, "SECTION_NOT_FOUND");
  return r;
}

export async function upsertSection(section: string, content: string) {
  const { rows } = await db.query<Row>(
    `INSERT INTO homepage_content(section_name, content, updated_at)
     VALUES ($1,$2,NOW())
     ON CONFLICT (section_name)
     DO UPDATE SET content=EXCLUDED.content, updated_at=NOW()
     RETURNING section_name, content, updated_at`,
    [section, content]
  );
  return rows[0];
}
