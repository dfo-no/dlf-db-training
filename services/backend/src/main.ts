// @deno-types="npm:@types/express@5.0.6"
import express from "express";
import { log } from "core/log";
import { db } from "./db.ts";
import { answersInfo, badgesInfo, questionsInfo, tagsInfo, userInfo } from "./routes/porfile_info.ts";
import { questionsEditYourAnswer, questionsPostInfo, questionsPostYourAnswer } from "./routes/questions.ts"

const app = express();
app.use(express.json());
//profile
app.get("/user/:id", userInfo);
app.get("/questions/:id", questionsInfo);
app.get("/answers/:id", answersInfo);
app.get("/tags/:id", tagsInfo);
app.get("/badges/:id", badgesInfo);

//questions
app.get("/questionsPost/:id", questionsPostInfo)
app.post("/questionsPost/post/", questionsPostYourAnswer)
app.post("/questionsPost/edit/", questionsEditYourAnswer)

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


