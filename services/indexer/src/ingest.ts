import { promises as fs } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import { v4 as uuidv4 } from "uuid";
import {
  buildAutoTags,
  normalizePrompt,
  parseFooocusParameters,
  parsePngTextChunks,
  ParsedParameters,
} from "@frameview/shared";
import { query } from "./db.js";
import type { FileEntry } from "./scanner.js";

interface ParsedImage {
  rawPrompt: string;
  prompt?: string | null;
  rawNegativePrompt?: string | null;
  negativePrompt?: string | null;
  settings: Record<string, string>;
  loras: ParsedParameters["loras"];
  sourceType: "png_text" | "unknown";
}

export async function ingestFiles(files: FileEntry[]) {
  for (const file of files) {
    const buffer = await fs.readFile(file.path);
    const size = imageSize(buffer);
    const width = size.width ?? 0;
    const height = size.height ?? 0;
    const folderId = await upsertFolder(path.dirname(file.path));

    const parsed = parseMetadata(file.path, buffer);
    const normalized = normalizePrompt(parsed.rawPrompt);
    const promptTags = extractPromptTags(parsed.rawPrompt);

    const imageId = await upsertImage({
      file,
      width,
      height,
      sourceType: parsed.sourceType,
    });
    await linkImageFolder(imageId, folderId);

    await upsertMetadata(imageId, parsed, normalized.prompt);

    const autoTags = buildAutoTags([...normalized.autoTags, ...promptTags]);
    await upsertTags(imageId, autoTags);
    await upsertCategories(imageId, parsed.rawPrompt);

    await upsertLoras(imageId, parsed.loras);
  }
}

function parseMetadata(filePath: string, buffer: Buffer): ParsedImage {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".png") {
    return {
      rawPrompt: "unknown",
      settings: {},
      loras: [],
      sourceType: "unknown",
    };
  }

  const text = parsePngTextChunks(buffer);
  if (!text.parameters) {
    return {
      rawPrompt: "unknown",
      settings: {},
      loras: [],
      sourceType: "unknown",
    };
  }

  const parsed = parseFooocusParameters(text.parameters);
  return {
    rawPrompt: parsed.rawPrompt || "unknown",
    rawNegativePrompt: parsed.rawNegativePrompt ?? null,
    negativePrompt: parsed.rawNegativePrompt ?? null,
    settings: parsed.settings,
    loras: parsed.loras,
    sourceType: "png_text",
  };
}

async function upsertImage({
  file,
  width,
  height,
  sourceType,
}: {
  file: FileEntry;
  width: number;
  height: number;
  sourceType: string;
}) {
  const id = uuidv4();
  const result = await query(
    `
    INSERT INTO images (id, path, filename, created_at, file_size, width, height, hash, source_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (path) DO UPDATE SET
      filename = EXCLUDED.filename,
      created_at = EXCLUDED.created_at,
      file_size = EXCLUDED.file_size,
      width = EXCLUDED.width,
      height = EXCLUDED.height,
      hash = EXCLUDED.hash,
      source_type = EXCLUDED.source_type
    RETURNING id
    `,
    [
      id,
      file.path,
      file.filename,
      file.createdAt,
      file.size,
      width,
      height,
      file.hash,
      sourceType,
    ]
  );

  return (result.rows[0] as { id: string }).id;
}

async function upsertMetadata(imageId: string, parsed: ParsedImage, prompt: string) {
  const settings = parsed.settings;

  const modelId = await upsertLookup("models", settings["Model"], settings["Model hash"]);
  const samplerId = await upsertLookup("samplers", settings["Sampler"], null, false);
  const schedulerId = await upsertLookup("schedulers", settings["Scheduler"], null, false);
  const vaeId = await upsertLookup("vaes", settings["VAE"], settings["VAE hash"]);

  await query(
    `
    INSERT INTO image_metadata (
      image_id, raw_prompt, prompt, raw_negative_prompt, negative_prompt,
      model_id, sampler_id, scheduler_id, vae_id,
      steps, cfg_scale, seed, sharpness, adm_guidance, performance, clip_skip, version
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT (image_id) DO UPDATE SET
      raw_prompt = EXCLUDED.raw_prompt,
      prompt = EXCLUDED.prompt,
      raw_negative_prompt = EXCLUDED.raw_negative_prompt,
      negative_prompt = EXCLUDED.negative_prompt,
      model_id = EXCLUDED.model_id,
      sampler_id = EXCLUDED.sampler_id,
      scheduler_id = EXCLUDED.scheduler_id,
      vae_id = EXCLUDED.vae_id,
      steps = EXCLUDED.steps,
      cfg_scale = EXCLUDED.cfg_scale,
      seed = EXCLUDED.seed,
      sharpness = EXCLUDED.sharpness,
      adm_guidance = EXCLUDED.adm_guidance,
      performance = EXCLUDED.performance,
      clip_skip = EXCLUDED.clip_skip,
      version = EXCLUDED.version
    `,
    [
      imageId,
      parsed.rawPrompt,
      prompt || null,
      parsed.rawNegativePrompt ?? null,
      parsed.negativePrompt ?? null,
      modelId,
      samplerId,
      schedulerId,
      vaeId,
      toInt(settings["Steps"]),
      toNumber(settings["CFG scale"]),
      settings["Seed"] ? String(settings["Seed"]) : null,
      toNumber(settings["Sharpness"]),
      settings["ADM Guidance"] ?? null,
      settings["Performance"] ?? null,
      toInt(settings["Clip skip"]),
      settings["Version"] ?? null,
    ]
  );
}

async function upsertLookup(table: string, name?: string, hash?: string | null, hasHash = true) {
  if (!name) return null;
  const id = uuidv4();
  const result = hasHash
    ? await query(
        `
        INSERT INTO ${table} (id, name, hash)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET
          hash = EXCLUDED.hash
        RETURNING id
        `,
        [id, name, hash ?? null]
      )
    : await query(
        `
        INSERT INTO ${table} (id, name)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
        RETURNING id
        `,
        [id, name]
      );

  if (result.rows[0]) return (result.rows[0] as { id: string }).id;
  const existing = await query<{ id: string }>(`SELECT id FROM ${table} WHERE name = $1`, [name]);
  return existing.rows[0]?.id ?? null;
}

async function upsertTags(imageId: string, tags: Array<{ name: string; kind: string }>) {
  for (const tag of tags) {
    const id = uuidv4();
    const result = await query(
      `
      INSERT INTO tags (id, name, kind)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO UPDATE SET kind = EXCLUDED.kind
      RETURNING id
      `,
      [id, tag.name, tag.kind]
    );

    const tagId = (result.rows[0] as { id: string }).id;

    await query(
      `
      INSERT INTO image_tags (image_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [imageId, tagId]
    );
  }
}

async function upsertLoras(imageId: string, loras: ParsedParameters["loras"]) {
  for (const lora of loras) {
    const id = uuidv4();
    const result = await query(
      `
      INSERT INTO loras (id, name, hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (name, hash) DO NOTHING
      RETURNING id
      `,
      [id, lora.name, lora.hash ?? null]
    );

    let loraId = result.rows[0] ? (result.rows[0] as { id: string }).id : null;

    if (!loraId) {
      const existing = await query<{ id: string }>(
        `SELECT id FROM loras WHERE name = $1 AND hash IS NOT DISTINCT FROM $2`,
        [lora.name, lora.hash ?? null]
      );
      loraId = existing.rows[0]?.id ?? null;
    }

    if (!loraId) continue;

    await query(
      `
      INSERT INTO image_loras (image_id, lora_id, weight)
      VALUES ($1, $2, $3)
      ON CONFLICT (image_id, lora_id) DO UPDATE SET weight = EXCLUDED.weight
      `,
      [imageId, loraId, lora.weight ?? null]
    );
  }
}

function extractPromptTags(rawPrompt: string): string[] {
  return rawPrompt
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token && !/^score_\d+(?:_up|_down)?$/i.test(token));
}

async function upsertCategories(imageId: string, rawPrompt: string) {
  const tokens = extractPromptTags(rawPrompt);
  if (tokens.length === 0) return;
  const primary = tokens[0];
  const categoryId = await upsertCategory(primary, "auto", primary);
  if (!categoryId) return;
  await query(
    `
    INSERT INTO image_categories (image_id, category_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
    [imageId, categoryId]
  );
}

async function upsertCategory(name: string, kind: string, sourceTag?: string | null) {
  const id = uuidv4();
  const result = await query(
    `
    INSERT INTO categories (id, name, description, kind, source_tag)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (name) DO UPDATE SET
      kind = EXCLUDED.kind,
      source_tag = EXCLUDED.source_tag
    RETURNING id
    `,
    [id, name, null, kind, sourceTag ?? null]
  );

  return (result.rows[0] as { id: string }).id;
}

async function upsertFolder(folderPath: string) {
  const id = uuidv4();
  const result = await query(
    `
    INSERT INTO folders (id, path, label, last_scanned_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (path) DO UPDATE SET
      last_scanned_at = EXCLUDED.last_scanned_at
    RETURNING id
    `,
    [id, folderPath, null]
  );

  return (result.rows[0] as { id: string }).id;
}

async function linkImageFolder(imageId: string, folderId: string) {
  await query(
    `
    INSERT INTO image_folders (image_id, folder_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
    [imageId, folderId]
  );
}

function toNumber(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInt(value?: string) {
  if (!value) return null;
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : null;
}
