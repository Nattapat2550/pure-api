import { db } from "../../config/db";
import { AppError } from "../../core/errors/AppError";
import { CarouselItem, UpsertCarouselBody } from "./carousel.types";

export async function listCarousel(): Promise<CarouselItem[]> {
  const { rows } = await db.query<CarouselItem>(
    `SELECT id, item_index, title, subtitle, description, image_dataurl, created_at, updated_at
     FROM carousel_items
     ORDER BY item_index ASC, id ASC`
  );
  return rows;
}

export async function createItem(body: Required<Pick<UpsertCarouselBody, "image_dataurl">> & UpsertCarouselBody) {
  const { rows } = await db.query<CarouselItem>(
    `INSERT INTO carousel_items (item_index, title, subtitle, description, image_dataurl, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
     RETURNING id, item_index, title, subtitle, description, image_dataurl, created_at, updated_at`,
    [
      body.item_index ?? 0,
      body.title ?? null,
      body.subtitle ?? null,
      body.description ?? null,
      body.image_dataurl
    ]
  );
  return rows[0];
}

export async function updateItem(id: number, body: UpsertCarouselBody) {
  const { rows } = await db.query<CarouselItem>(
    `UPDATE carousel_items
     SET item_index = COALESCE($2, item_index),
         title = COALESCE($3, title),
         subtitle = COALESCE($4, subtitle),
         description = COALESCE($5, description),
         image_dataurl = COALESCE($6, image_dataurl),
         updated_at = NOW()
     WHERE id=$1
     RETURNING id, item_index, title, subtitle, description, image_dataurl, created_at, updated_at`,
    [id, body.item_index ?? null, body.title ?? null, body.subtitle ?? null, body.description ?? null, body.image_dataurl ?? null]
  );
  const r = rows[0];
  if (!r) throw new AppError("Carousel item not found", 404, "CAROUSEL_NOT_FOUND");
  return r;
}

export async function deleteItem(id: number) {
  const { rowCount } = await db.query(`DELETE FROM carousel_items WHERE id=$1`, [id]);
  if (!rowCount) throw new AppError("Carousel item not found", 404, "CAROUSEL_NOT_FOUND");
  return true;
}
