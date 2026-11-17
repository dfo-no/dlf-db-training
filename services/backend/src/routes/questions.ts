// @deno-types="npm:@types/express@5.0.6"
import type { Request, Response } from "express";
import { db } from "../db.ts";
import { log } from "core/log";

//user section
export async function questionsPostInfo(_req: Request, res: Response) {
	const id = _req.params.id

	try {
		const { rows } = await db.query(`
            SELECT p.id, p.acceptedanswerid AS "acceptedAnswerId", p.title, p.body, p.tags, p.lasteditdate AS "lastEditDate", 
                p.creationdate AS "creationDate", p.owneruserid AS "ownerUserId", p.ownerdisplayname AS "ownerDisplayName", users.displayname AS "displayName", badge_counts.*, 
                p.score, p.favoritecount AS "favoriteCount", p.viewcount AS "viewCount", p.lastactivitydate AS "lastActivityDate", 
                users.reputation, comments.*, votes_count.* 
                FROM posts AS p
                LEFT JOIN LATERAL (
                    SELECT jsonb_agg(jsonb_build_object('comment', c.*, 'user', u.displayname) order by c.id) AS "comments"
                        FROM comments as c
                        LEFT JOIN LATERAL (
                            SELECT *
                                FROM users as u
                                WHERE u.id = c.userid
                        ) AS u
                            ON 1=1
                        WHERE c.postid = p.id
                        GROUP BY c.postid
                ) AS comments
                    ON 1=1
                LEFT JOIN LATERAL (
                    SELECT *
                        FROM users as u
                        WHERE id = p.owneruserid
                ) AS users
                    ON 1=1
                LEFT JOIN LATERAL (
                    SELECT
                        COUNT(CASE WHEN b.class = 1 THEN 1 END) AS gold,
                        COUNT(CASE WHEN b.class = 2 THEN 1 END) AS silver,
                        COUNT(CASE WHEN b.class = 3 THEN 1 END) AS bronze
                    FROM badges AS b
                    WHERE b.userid = p.owneruserid
                ) AS badge_counts
                    ON 1=1
                LEFT JOIN LATERAL (
					SELECT COUNT(*)
						FROM votes AS v
						WHERE 1=1
							AND v.postid = p.id
							OR p.parentid = p.id
				) AS votes_count
					ON 1=1
                WHERE 1=1
                    AND p.id = $1
                    OR p.parentid = $1
                ORDER BY p.posttypeid, count DESC
		`, [id]);
		res.json(rows);
	} catch (error) {
		log.error("SQL error in GET /users", { error });
		res.status(503).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

export async function questionsPostYourAnswer(_req: Request, res: Response) {
	const data = _req.body.data
    const date = new Date().toISOString()
    const { rows } = await db.query(`
        SELECT MAX(id)
	        FROM posts
    `)
    const id = rows[0].max +1

	try {
		const { rows } = await db.query(`
            INSERT INTO posts (id, posttypeid, parentid, creationdate, score, body, owneruserid, lastactivitydate, commentcount, contentlicense)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, [id, 2, data.parentId, date, 0, data.answer, -1, date, 0, "CC BY-SA 2.5"]);
		res.json(rows);
	} catch (error) {
		log.error("SQL error in GET /users", { error });
		res.status(503).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

export async function questionsEditYourAnswer(_req: Request, res: Response) {
	const data = _req.body.data
    const date = new Date().toISOString()
    console.log(data)

	try {
		const { rows } = await db.query(`
            UPDATE posts AS p
                SET body = $1, lasteditoruserid = $2, lasteditdate = $3, lastactivitydate = $3 
                WHERE p.id = $4
		`, [data.answer, -1, date, data.id]);
		res.json(rows);
	} catch (error) {
		log.error("SQL error in GET /users", { error });
		res.status(503).json({
			error: error instanceof Error ? error.message : String(error),
		});
	}
}