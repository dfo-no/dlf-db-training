// @deno-types="npm:@types/express@5.0.6"
import type { Request, Response } from "express";
import { db } from "../db.ts";
import { log } from "core/log";

export async function getTopUsers(_req: Request, res: Response) {
  const pageSize = 25;
  try {
    const { rows } = await db.query(`
      SELECT id, displayname AS "displayName", reputation, location
      FROM public.users AS u
      WHERE 1=1
	      AND u.displayname like '%Brent%'
	      --AND u.id = 26837
      ORDER BY reputation DESC NULLS LAST, id ASC
      LIMIT $1
      `, [pageSize],
    );
    res.json(rows);
  } catch (error) {
    log.error("SQL error in GET /users", { error });
    res.status(503).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
