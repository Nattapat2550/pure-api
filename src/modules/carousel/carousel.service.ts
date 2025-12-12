import { pool } from '../../config/db';
import { CarouselPayload } from './carousel.types';

export async function listCarouselItems() {
  const { rows } = await pool.query(
    `SELECT id, item_index, title, subtitle, description, image_dataurl
     FROM carousel_items
     ORDER BY item_index ASC, id ASC`
  );
  return rows;
}

export async function createCarouselItem(payload: CarouselPayload) {
  const { item_index, title, subtitle, description, image_dataurl } = payload;
  const { rows } = await pool.query(
    `INSERT INTO carousel_items (item_index, title, subtitle, description, image_dataurl)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, item_index, title, subtitle, description, image_dataurl`,
    [item_index, title ?? null, subtitle ?? null, description ?? null, image_dataurl]
  );
  return rows[0];
}

export async function updateCarouselItem(
  id: number,
  payload: Partial<CarouselPayload>
) {
  const { item_index, title, subtitle, description, image_dataurl } = payload;

  const { rows } = await pool.query(
    `UPDATE carousel_items
       SET item_index = COALESCE($2, item_index),
           title = COALESCE($3, title),
           subtitle = COALESCE($4, subtitle),
           description = COALESCE($5, description),
           image_dataurl = COALESCE($6, image_dataurl)
     WHERE id=$1
     RETURNING id, item_index, title, subtitle, description, image_dataurl`,
    [
      id,
      item_index ?? null,
      title ?? null,
      subtitle ?? null,
      description ?? null,
      image_dataurl ?? null
    ]
  );
  return rows[0] ?? null;
}

export async function deleteCarouselItem(id: number) {
  await pool.query('DELETE FROM carousel_items WHERE id=$1', [id]);
}
