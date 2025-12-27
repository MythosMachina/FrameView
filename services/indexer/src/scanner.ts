import { createHash } from "node:crypto";
import { Dirent, promises as fs } from "node:fs";
import path from "node:path";

export interface FileEntry {
  path: string;
  filename: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  hash: string;
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export async function scanRoots(roots: string[]): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  for (const root of roots) {
    await walk(root, entries);
  }
  return entries;
}

async function walk(dir: string, entries: FileEntry[]) {
  let items: Array<Dirent> = [];
  try {
    items = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walk(fullPath, entries);
      continue;
    }

    if (!item.isFile()) continue;
    const ext = path.extname(item.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const stat = await fs.stat(fullPath);
    const hash = await hashFile(fullPath);

    entries.push({
      path: fullPath,
      filename: item.name,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
      modifiedAt: stat.mtime.toISOString(),
      hash,
    });
  }
}

async function hashFile(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  const file = await fs.open(filePath, "r");
  const stream = file.createReadStream();

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", (err) => reject(err));
    stream.on("end", async () => {
      await file.close();
      resolve(hash.digest("hex"));
    });
  });
}
