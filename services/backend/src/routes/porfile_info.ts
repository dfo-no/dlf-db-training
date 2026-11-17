// @deno-types="npm:@types/express@5.0.6"
import type { Request, Response } from "express";
import { db } from "../db.ts";
import { log } from "core/log";

//user section
export async function userInfo(_req: Request, res: Response) {
	const id = _req.params.id

	try {
		const { rows } = await db.query(`
			SELECT id, reputation, views, displayname AS "displayName", creationdate AS "creationDate", lastaccessdate AS "lastAccessDate", websiteurl AS "websiteUrl", location, aboutme AS "aboutMe", upvotes AS "upVotes", downvotes AS "downVotes", q_count.questions AS "questionsTotal", q_count.answers AS "answersTotal"
				FROM users as u
				LEFT JOIN LATERAL(
					SELECT
						COUNT (CASE WHEN p.posttypeid = 1 THEN 1 END) AS questions,
						COUNT (CASE WHEN p.posttypeid = 2 THEN 1 END) AS answers
						FROM posts AS p
							WHERE 1=1
								AND p.owneruserid = u.id
				) AS q_count
					ON 1=1
				WHERE 1=1
					AND u.id = $1
		`, [id]);
		res.json(rows[0]);
	} catch (error) {
		log.error("SQL error in GET /users", { error });
		res.status(503).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

//question section
export async function questionsInfo(_req: Request, res: Response) {
	const id = _req.params.id

	try {
		const { rows } = await db.query(`
			SELECT v_count.votes, p.answercount AS "answerCount", p.viewcount AS "viewCount", p.title, p.tags, p.lastactivitydate AS "lastActivityDate"
				FROM posts AS p
				LEFT JOIN LATERAL(
					SELECT
						COUNT(v.*) AS votes
						FROM votes AS v
						WHERE v.postid = p.id
				) AS v_count
					ON 1 = 1
				WHERE 1 = 1
					AND p.owneruserid = $1
					AND p.posttypeid = 1  
		`, [id]);
		res.json(rows);
	} catch (error) {
		log.error("SQL error in GET /users", { error });
		res.status(503).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

//answers section
export async function answersInfo(_req: Request, res: Response) {
	const id = _req.params.id

	try {
		const { rows } = await db.query(`
			SELECT p.parentid, v_count.votes, p2.title
				FROM posts AS p
				INNER JOIN posts AS p2
					ON p2.id = p.parentid
				LEFT JOIN LATERAL(
					SELECT
						COUNT(v.*) AS votes
						FROM votes AS v
						WHERE v.postid = p.id
				) AS v_count
					ON 1 = 1
				WHERE 1=1
					AND p.owneruserid = $1
					AND p.posttypeid = 2
				ORDER BY p2.id
				LIMIT 30
		`, [id]);
		res.json(rows);
	} catch (error) {
		log.error("SQL error in GET /users", { error });
		res.status(503).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

//tags section
export async function tagsInfo(_req: Request, res: Response) {
	const id = _req.params.id

	try {
		const { rows } = await db.query(`
			SELECT
				CASE
					WHEN p.posttypeid = 1 
						THEN p.tags
					ELSE p2.tags
					END AS tags
				FROM posts AS p
				LEFT JOIN posts AS p2
					ON p2.id = p.parentid
				WHERE 1=1
					AND p.owneruserid = $1  
		`, [id]);
		res.json(rows);
	} catch (error) {
		log.error("SQL error in GET /users", { error });
		res.status(503).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

//badges section
export async function badgesInfo(_req: Request, res: Response) {
	const id = _req.params.id

	try {
		const { rows } = await db.query(`
			SELECT b.name, b.class, COUNT(*) AS count
				FROM badges AS b
				WHERE b.userid = $1
				GROUP BY b.name, b.class
				ORDER BY count DESC
		`, [id]);
		res.json(rows);
	} catch (error) {
		log.error("SQL error in GET /users", { error });
		res.status(503).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

// SELECT id, displayname AS "displayName", reputation, location
//       FROM public.users AS u
//       WHERE 1=1
// 	      -- AND u.displayname like '%Brent%'
// 	      --AND u.id = 26837
//       ORDER BY reputation DESC NULLS LAST, id ASC
//       LIMIT $1
//       , [pageSize],
