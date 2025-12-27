import { scanRoots } from "./scanner.js";
import { ingestFiles } from "./ingest.js";
import { pool } from "./db.js";

function parseRoots() {
  const arg = process.argv.find((value) => value.startsWith("--roots="));
  if (arg) {
    return arg.replace("--roots=", "").split(",").map((p) => p.trim()).filter(Boolean);
  }
  if (process.env.INDEX_ROOTS) {
    return process.env.INDEX_ROOTS.split(",").map((p) => p.trim()).filter(Boolean);
  }
  if (process.env.ROOTS) {
    return process.env.ROOTS.split(",").map((p) => p.trim()).filter(Boolean);
  }
  return [];
}

async function main() {
  const roots = parseRoots();
  if (roots.length === 0) {
    console.error("No roots configured. Use --roots=/path1,/path2 or ROOTS env var.");
    process.exit(1);
  }

  const files = await scanRoots(roots);
  await ingestFiles(files);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  pool.end().catch(() => undefined);
  process.exit(1);
});
