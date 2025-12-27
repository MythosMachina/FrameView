import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? "postgres",
  password: process.env.PGPASSWORD ?? "postgres",
  database: process.env.PGDATABASE ?? "frameview",
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: Array<unknown> = []
) {
  const result = await pool.query<T>(text, params);
  return result;
}
