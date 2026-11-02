// Adapted from dlf-backend's Winston logger.
import winston from "winston";
import { getSelectedFormat, jsonFormat } from "./log-format.ts";

const levels = {
  critical: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  silly: 5,
};

winston.addColors({
  critical: "bold red whiteBG",
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue",
  silly: "white",
});

interface Logger extends winston.Logger {
  critical: winston.LeveledLogMethod;
}

const date = new Date();
const logFileName = [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("_") + "_backend.log";

export const log = winston.createLogger({
  levels,
  level: Deno.env.get("BACKEND_STDOUT_LEVEL") || "debug",
  transports: [
    new winston.transports.Console({ format: getSelectedFormat() }),
    new winston.transports.File({
      filename: `logs/${logFileName}`,
      format: jsonFormat,
    }),
  ],
  exitOnError: false,
}) as Logger;
