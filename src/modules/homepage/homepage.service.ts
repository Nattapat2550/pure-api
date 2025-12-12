import { pool } from '../../config/db';

export async function listHomepageContent() {
  const { rows } = await pool.query(
    'SELECT section_name, content FROM homepage_content ORDER BY section_name ASC'
  );
  return rows;
}

export async function upsertHomepageSection(
  sectionName: string,
  content: string
) {
  const { rows } = await pool.query(
    `INSERT INTO homepage_content (section_name, content)
     VALUES ($1,$2)
     ON CONFLICT (section_name) DO UPDATE SET content=EXCLUDED.content
     RETURNING section_name, content`,
    [sectionName, content]
  );
  return rows[0];
}
