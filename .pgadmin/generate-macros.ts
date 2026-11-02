import { parseManifest } from "./import-macros.ts";

// Read only the configured user's macros, never the full settings database.
const exportBridge = String.raw`
import json, os, sqlite3

connection = sqlite3.connect(
    'file:/var/lib/pgadmin/pgadmin4.db?mode=ro', uri=True, timeout=30)
connection.row_factory = sqlite3.Row
try:
    with connection:
        connection.execute('BEGIN')
        user = connection.execute('SELECT id FROM user WHERE email=?',
            (os.environ['PGADMIN_DEFAULT_EMAIL'],)).fetchone()
        if user is None:
            raise RuntimeError('pgAdmin default user not found; finish startup first')
        rows = connection.execute('''
            SELECT um.name, um.sql, m.alt, m.control, m.key, m.key_code
            FROM user_macros um LEFT JOIN macros m ON m.id=um.mid
            WHERE um.uid=? AND um.sql IS NOT NULL AND trim(um.sql) <> ?
            ORDER BY m.id, um.id
        ''', (user['id'], '')).fetchall()
        print(json.dumps([dict(row) for row in rows]))
finally:
    connection.close()
`;

export function prepareExport(
  value: unknown,
  previous: unknown,
  existingFiles: string[],
) {
  if (!Array.isArray(value)) {
    throw new Error("Invalid macro export from pgAdmin");
  }
  const definitions = parseManifest(previous);
  const reserved = new Set([
    ...existingFiles.map((file) => file.toLowerCase()),
    ...definitions.map((macro) => macro.file.toLowerCase()),
  ]);
  const usedFiles = new Set<string>();
  const usedShortcuts = new Set<string>();
  return value.map((row: unknown, index) => {
    if (
      typeof row !== "object" || row === null ||
      !("sql" in row) || typeof row.sql !== "string" || !row.sql.trim() ||
      !("key" in row) || typeof row.key !== "string"
    ) throw new Error(`Invalid exported macro at index ${index}`);
    const [macro] = parseManifest([{ ...row, file: "macro.sql" }]);
    const shortcut = `${macro.alt}:${macro.control}:${macro.key_code}`;
    if (usedShortcuts.has(shortcut)) {
      throw new Error(`Duplicate shortcut in pgAdmin: ${macro.name}`);
    }
    usedShortcuts.add(shortcut);
    const previousMacro = definitions.find((candidate) =>
      candidate.alt === macro.alt && candidate.control === macro.control &&
      candidate.key_code === macro.key_code
    );
    let file = previousMacro?.file;
    if (!file || usedFiles.has(file.toLowerCase())) {
      const stem = macro.name.toLowerCase().normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")
        .slice(0, 80) || "macro";
      // Prefix avoids Windows device names such as CON.sql and AUX.sql.
      const safeStem = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(stem)
        ? `macro-${stem}`
        : stem;
      file = `${safeStem}.sql`;
      for (let suffix = 2; reserved.has(file.toLowerCase()); suffix++) {
        file = `${safeStem}-${suffix}.sql`;
      }
    }
    reserved.add(file.toLowerCase());
    usedFiles.add(file.toLowerCase());
    return {
      definition: {
        name: macro.name,
        alt: macro.alt,
        control: macro.control,
        key: row.key,
        key_code: macro.key_code,
        file,
      },
      sql: row.sql,
    };
  });
}

async function main() {
  const directory = new URL("./", import.meta.url);
  const macroDirectory = new URL("macros/", directory);
  const manifest = new URL("macros.json", macroDirectory);
  let previous: unknown = [];
  const existingFiles: string[] = [];
  try {
    previous = JSON.parse(await Deno.readTextFile(manifest));
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  try {
    for await (const entry of Deno.readDir(macroDirectory)) {
      existingFiles.push(entry.name);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  const result = await new Deno.Command("docker", {
    cwd: directory,
    args: [
      "compose",
      "-f",
      "../compose.yaml",
      "exec",
      "-T",
      "--user",
      "5050:5050",
      "pgadmin",
      "/venv/bin/python3",
      "-c",
      exportBridge,
    ],
    stdout: "piped",
    stderr: "inherit",
  }).output();
  if (!result.success) {
    throw new Error(
      "Export failed. Ensure Docker and Compose pgAdmin are running and ready.",
    );
  }
  const macros = prepareExport(
    JSON.parse(new TextDecoder().decode(result.stdout)),
    previous,
    existingFiles,
  );
  await Deno.mkdir(macroDirectory, { recursive: true });
  for (const macro of macros) {
    await Deno.writeTextFile(
      new URL(macro.definition.file, macroDirectory),
      macro.sql,
    );
  }
  await Deno.writeTextFile(
    manifest,
    JSON.stringify(macros.map((macro) => macro.definition), null, 2) + "\n",
  );
  console.log(
    `Exported ${macros.length} macros to macros/. Unreferenced SQL files were retained.`,
  );
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
