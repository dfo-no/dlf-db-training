// @deno-types="npm:@types/pg@8.16.0"
import pg from "pg";
import { log } from "core/log";

export const db = new pg.Pool({
  host: Deno.env.get("DB_PSQL_HOST") ?? "localhost",
  port: Number(Deno.env.get("DB_PSQL_PORT") ?? "5432"),
  user: Deno.env.get("DB_PSQL_USER") ?? "postgres",
  password: Deno.env.get("DB_PSQL_PASSWORD") ?? "postgres",
  database: Deno.env.get("DB_NAME") ?? "stackoverflow2010",
  connectionTimeoutMillis: 5000,
});

db.on("error", (error) => log.error("Database connection error", { error }));
