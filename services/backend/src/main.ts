// @deno-types="npm:@types/express@5.0.6"
import express from "express";
import { log } from "core/log";
import { db } from "./db.ts";
import { answersInfo, badgesInfo, questionsInfo, tagsInfo, userInfo } from "./routes/porfile_info.ts";

const app = express();
app.use(express.json());
app.get("/user", userInfo);
app.get("/questions", questionsInfo);
app.get("/answers", answersInfo);
app.get("/tags", tagsInfo);
app.get("/badges", badgesInfo);

const port = Number(Deno.env.get("BACKEND_PORT") ?? "5001");
const server = app.listen(port, "0.0.0.0", () => {
  log.info(`Backend listening on port ${port}`);
});

function shutdown() {
  server.close(async () => {
    await db.end();
    log.end(() => Deno.exit());
  });
}

Deno.addSignalListener("SIGINT", shutdown);
if (Deno.build.os !== "windows") {
  Deno.addSignalListener("SIGTERM", shutdown);
}


