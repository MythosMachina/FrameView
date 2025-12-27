import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  createCategory,
  createFolder,
  createTag,
  listCategories,
  listFolders,
  listImages,
  listLoras,
  listModels,
  listTags,
} from "./queries.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

const imageRoot = path.resolve(process.env.IMAGE_ROOT ?? "/ai/FrameView/images");

app.get("/media/*", async (request, reply) => {
  const params = request.params as { "*": string };
  const requested = params["*"] ?? "";
  const safePath = requested.replace(/^[\\/]+/, "");
  const absolutePath = path.resolve(imageRoot, safePath);

  if (!absolutePath.startsWith(imageRoot)) {
    reply.code(403);
    return { error: "forbidden" };
  }

  try {
    const stats = await stat(absolutePath);
    if (!stats.isFile()) {
      reply.code(404);
      return { error: "not found" };
    }
  } catch {
    reply.code(404);
    return { error: "not found" };
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : "application/octet-stream";

  reply.type(mime);
  return reply.send(createReadStream(absolutePath));
});

app.get("/health", async () => ({ status: "ok" }));

app.get("/images", async (request) => {
  const query = request.query as Record<string, string | undefined>;
  const tags = query.tags
    ? query.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    : undefined;
  const cursor = parseCursor(query.cursor);

  const { rows, nextCursor } = await listImages({
    text: query.text,
    tags,
    category: query.category,
    lora: query.lora,
    model: query.model,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    minWidth: query.minWidth ? Number(query.minWidth) : undefined,
    minHeight: query.minHeight ? Number(query.minHeight) : undefined,
    maxWidth: query.maxWidth ? Number(query.maxWidth) : undefined,
    maxHeight: query.maxHeight ? Number(query.maxHeight) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : 60,
    cursor,
  });

  const baseUrl = `${request.protocol}://${request.headers.host}`;
  const mapped = rows.map((row) => {
    const record = row as Record<string, unknown>;
    const absolutePath = typeof record.path === "string" ? record.path : "";
    const relativePath = absolutePath.startsWith(imageRoot)
      ? absolutePath.slice(imageRoot.length + 1)
      : absolutePath;
    return {
      ...record,
      image_url: `${baseUrl}/media/${encodeURI(relativePath.replace(/\\\\/g, "/"))}`,
    };
  });

  return { rows: mapped, nextCursor };
});

app.get("/tags", async () => {
  const rows = await listTags();
  return { rows };
});

app.post("/tags", async (request) => {
  const body = request.body as { name?: string; kind?: string };
  if (!body?.name || !body.kind) {
    return { error: "name and kind required" };
  }
  const row = await createTag(randomUUID(), body.name, body.kind);
  return { row };
});

app.get("/categories", async () => {
  const rows = await listCategories();
  return { rows };
});

app.get("/models", async () => {
  const rows = await listModels();
  return { rows };
});

app.get("/loras", async () => {
  const rows = await listLoras();
  return { rows };
});

app.post("/categories", async (request) => {
  const body = request.body as { name?: string; description?: string; kind?: string; source_tag?: string };
  if (!body?.name) {
    return { error: "name required" };
  }
  const row = await createCategory(
    randomUUID(),
    body.name,
    body.description ?? null,
    body.kind ?? "user",
    body.source_tag ?? null
  );
  return { row };
});

app.get("/folders", async () => {
  const rows = await listFolders();
  return { rows };
});

app.post("/folders", async (request) => {
  const body = request.body as { path?: string; label?: string };
  if (!body?.path) {
    return { error: "path required" };
  }
  const row = await createFolder(randomUUID(), body.path, body.label ?? null);
  return { row };
});

const execFileAsync = promisify(execFile);

app.post("/reindex", async () => {
  try {
    await execFileAsync("systemctl", ["restart", "frameview-indexer.service"]);
    return { status: "started" };
  } catch (err) {
    app.log.error(err);
    return { status: "error" };
  }
});

app.get("/indexer-status", async () => {
  try {
    const { stdout } = await execFileAsync("systemctl", ["is-active", "frameview-indexer.service"]);
    return { status: stdout.trim() };
  } catch {
    return { status: "unknown" };
  }
});

const port = Number(process.env.PORT ?? 4010);
const host = process.env.HOST ?? "0.0.0.0";

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

function parseCursor(value?: string) {
  if (!value) return undefined;
  const parts = value.split("|");
  if (parts.length !== 2) return undefined;
  return { createdAt: parts[0], id: parts[1] };
}
