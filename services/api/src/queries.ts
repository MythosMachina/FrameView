import { query } from "./db.js";

export interface ImageQuery {
  text?: string;
  tags?: string[];
  category?: string;
  lora?: string;
  model?: string;
  dateFrom?: string;
  dateTo?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  pageSize?: number;
  cursor?: { createdAt: string; id: string };
}

export async function listImages(filters: ImageQuery) {
  const conditions: string[] = [];
  const params: Array<unknown> = [];

  if (filters.text) {
    params.push(`%${filters.text}%`);
    conditions.push(
      "(image_metadata.raw_prompt ILIKE $" +
        params.length +
        " OR image_metadata.prompt ILIKE $" +
        params.length +
        " OR image_metadata.raw_negative_prompt ILIKE $" +
        params.length +
        " OR image_metadata.negative_prompt ILIKE $" +
        params.length +
        ")"
    );
  }

  if (filters.model) {
    params.push(filters.model);
    conditions.push("models.name = $" + params.length);
  }

  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    conditions.push("images.created_at >= $" + params.length);
  }

  if (filters.dateTo) {
    params.push(filters.dateTo);
    conditions.push("images.created_at <= $" + params.length);
  }

  if (filters.minWidth) {
    params.push(filters.minWidth);
    conditions.push("images.width >= $" + params.length);
  }

  if (filters.minHeight) {
    params.push(filters.minHeight);
    conditions.push("images.height >= $" + params.length);
  }

  if (filters.maxWidth) {
    params.push(filters.maxWidth);
    conditions.push("images.width <= $" + params.length);
  }

  if (filters.maxHeight) {
    params.push(filters.maxHeight);
    conditions.push("images.height <= $" + params.length);
  }

  let tagFilterClause = "";
  if (filters.tags && filters.tags.length > 0) {
    params.push(filters.tags);
    tagFilterClause =
      "images.id IN (SELECT image_id FROM image_tags JOIN tags ON tags.id = image_tags.tag_id WHERE tags.name = ANY($" +
      params.length +
      "))";
    conditions.push(tagFilterClause);
  }

  if (filters.category) {
    params.push(filters.category);
    conditions.push(
      "images.id IN (SELECT image_id FROM image_categories JOIN categories ON categories.id = image_categories.category_id WHERE categories.name = $" +
        params.length +
        ")"
    );
  }

  if (filters.lora) {
    params.push(filters.lora);
    conditions.push(
      "images.id IN (SELECT image_id FROM image_loras JOIN loras ON loras.id = image_loras.lora_id WHERE loras.name = $" +
        params.length +
        ")"
    );
  }

  const pageSize = filters.pageSize ?? 60;

  if (filters.cursor) {
    params.push(filters.cursor.createdAt, filters.cursor.id);
    conditions.push(`(images.created_at, images.id) < ($${params.length - 1}::timestamp, $${params.length}::uuid)`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(pageSize + 1);
  const limitParam = "$" + params.length;

  const sql = `
    SELECT
      images.id,
      images.path,
      images.filename,
      images.created_at,
      images.file_size,
      images.width,
      images.height,
      image_metadata.raw_prompt,
      image_metadata.prompt,
      image_metadata.raw_negative_prompt,
      image_metadata.negative_prompt,
      models.name AS model_name,
      vaes.name AS vae_name,
      samplers.name AS sampler_name,
      schedulers.name AS scheduler_name,
      image_metadata.steps,
      image_metadata.cfg_scale,
      image_metadata.seed,
      image_metadata.sharpness,
      image_metadata.performance,
      image_metadata.clip_skip,
      image_metadata.version,
      COALESCE(array_agg(DISTINCT tags.name) FILTER (WHERE tags.name IS NOT NULL), '{}') AS tags
    FROM images
    LEFT JOIN image_metadata ON image_metadata.image_id = images.id
    LEFT JOIN models ON image_metadata.model_id = models.id
    LEFT JOIN vaes ON image_metadata.vae_id = vaes.id
    LEFT JOIN samplers ON image_metadata.sampler_id = samplers.id
    LEFT JOIN schedulers ON image_metadata.scheduler_id = schedulers.id
    LEFT JOIN image_tags ON image_tags.image_id = images.id
    LEFT JOIN tags ON tags.id = image_tags.tag_id
    ${whereClause}
    GROUP BY images.id, image_metadata.image_id, models.id, vaes.id, samplers.id, schedulers.id
    ORDER BY images.created_at DESC, images.id DESC
    LIMIT ${limitParam}
  `;

  const result = await query(sql, params);
  const rows = result.rows as Array<Record<string, unknown>>;
  const hasMore = rows.length > pageSize;
  const trimmed = hasMore ? rows.slice(0, pageSize) : rows;
  const last = trimmed[trimmed.length - 1] as { created_at?: string; id?: string } | undefined;
  const nextCursor =
    hasMore && last?.created_at && last?.id ? `${last.created_at}|${last.id}` : null;

  return { rows: trimmed, nextCursor };
}

export async function listTags() {
  const result = await query(
    `SELECT id, name, kind FROM tags ORDER BY name ASC`
  );
  return result.rows as Array<Record<string, unknown>>;
}

export async function listCategories() {
  const result = await query(
    `SELECT id, name, description, kind, source_tag FROM categories ORDER BY name ASC`
  );
  return result.rows as Array<Record<string, unknown>>;
}

export async function listModels() {
  const result = await query(
    `SELECT id, name, hash FROM models ORDER BY name ASC`
  );
  return result.rows as Array<Record<string, unknown>>;
}

export async function listLoras() {
  const result = await query(
    `SELECT id, name, hash FROM loras ORDER BY name ASC`
  );
  return result.rows as Array<Record<string, unknown>>;
}

export async function listFolders() {
  const result = await query(
    `SELECT id, path, label, last_scanned_at FROM folders ORDER BY path ASC`
  );
  return result.rows as Array<Record<string, unknown>>;
}

export async function createTag(id: string, name: string, kind: string) {
  const result = await query(
    `INSERT INTO tags (id, name, kind) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET kind = EXCLUDED.kind RETURNING id, name, kind`,
    [id, name, kind]
  );
  return result.rows[0] as Record<string, unknown>;
}

export async function createCategory(
  id: string,
  name: string,
  description?: string | null,
  kind: string = "user",
  sourceTag?: string | null
) {
  const result = await query(
    `INSERT INTO categories (id, name, description, kind, source_tag) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, kind = EXCLUDED.kind, source_tag = EXCLUDED.source_tag RETURNING id, name, description, kind, source_tag`,
    [id, name, description ?? null, kind, sourceTag ?? null]
  );
  return result.rows[0] as Record<string, unknown>;
}

export async function createFolder(id: string, pathValue: string, label?: string | null) {
  const result = await query(
    `INSERT INTO folders (id, path, label, last_scanned_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (path) DO UPDATE SET label = EXCLUDED.label RETURNING id, path, label, last_scanned_at`,
    [id, pathValue, label ?? null]
  );
  return result.rows[0] as Record<string, unknown>;
}
