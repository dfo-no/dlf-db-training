// DLF's text, indented text and JSON formats, without application-specific context.
import winston from "winston";

function serializeValue(key: string, value: unknown): unknown {
  if (
    ["key", "pwd", "password", "user", "connectsid"].includes(key.toLowerCase())
  ) {
    return "";
  }
  if (value instanceof Error) {
    return {
      ...value,
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: value.cause,
    };
  }
  return value;
}

function metadata(value: unknown): string {
  return (Array.isArray(value) ? value : [])
    .map((arg: unknown) =>
      typeof arg === "object"
        ? JSON.stringify(arg, serializeValue)
        : String(arg)
    )
    .join(" ");
}

const textFormat = winston.format.combine(
  Deno.env.get("BACKEND_STDOUT_COLORIZE") === "true"
    ? winston.format.colorize()
    : winston.format.uncolorize(),
  winston.format.timestamp({ format: "HH:mm:ss:SSS" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = metadata(meta[Symbol.for("splat")]);
    return `${level.padEnd(5, " ")} > ${timestamp} > ${message}${
      extra ? ` > ${extra}` : ""
    }`;
  }),
);

let indent = "";
const textIndentFormatter = winston.format((info) => {
  if (typeof info.message === "string") {
    if (info.message.includes("> Finished")) indent = indent.slice(0, -2);
    const starts = info.message.includes("> Start");
    info.message = indent + info.message;
    if (starts) indent += "| ";
  }
  return info;
});

export const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:SSS" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) =>
    JSON.stringify({
      timestamp,
      level,
      message,
      meta: metadata(meta[Symbol.for("splat")]),
    })
  ),
);

export function getSelectedFormat() {
  switch (Deno.env.get("BACKEND_STDOUT_FORMAT")) {
    case "text":
      return textFormat;
    case "textindent":
      return winston.format.combine(textIndentFormatter(), textFormat);
    default:
      return jsonFormat;
  }
}
